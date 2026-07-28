"use client";

/**
 * Page 12, "Teaching Models to Reason: STaR and Self-Improvement". Every tool
 * in the act so far spends its compute at answer time and throws the reasoning
 * away. STaR (Zelikman et al. 2022) is the bridge from inference-time back to
 * train-time: a chain that reached a verified answer is a worked solution the
 * model wrote for itself — training data. Generate, keep what checks out,
 * fine-tune, repeat.
 *
 * Step 1 is the loop itself (lib/star.ts), run iteration by iteration. The
 * mechanism is illustrative and seeded, not a digitized curve: 60 problems with
 * fixed per-problem solvability thresholds, so the solved set grows exactly
 * when skill grows and every run is reproducible. Three behaviours to feel:
 * the ratchet (each round's better model writes correct rationales for harder
 * problems), the plateau (problems the model can never solve unaided never
 * enter the set), and rationalization lifting the plateau (show the model the
 * missed answer, let it reason backwards, train on the rationale). The filter
 * toggle is the page's flag for Act 3: switch the answer key off and the loop
 * trains on its own mistakes until accuracy sinks toward chance.
 *
 * Step 2 is the paper's Table 1 (data/star-cqa.json), quoted verbatim: 6B
 * GPT-J plus its own filtered rationales lands at 72.5% on CommonsenseQA,
 * beside 73.0% for a 30x larger GPT-3 fine-tuned on the full human-labelled
 * training set.
 *
 * Step 3 names the lineage — generate → filter → train is sampling, a
 * verifiable reward, and policy improvement, the conceptual ancestor of the
 * RL-from-verifiable-rewards recipe behind o1 and R1 (page 16) — and the fine
 * print: the filter is load-bearing, which the reader has just watched.
 *
 * Sidenote convention as on pages 3–8: one "Try it" note beside the
 * interactive, bare-cite References notes beside the steps that use them,
 * citation badges + provenance footnote at the bottom.
 */

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
import type { Citation } from "@/lib/data";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import {
  STAR_CHOICES,
  STAR_MAX_ITERS,
  STAR_POOL,
  starBase,
  starInit,
  starStep,
  type StarIteration,
} from "@/lib/star";
import { useStore } from "@/store/useStore";

const PAGE_N = 12;
const POOL = starInit();
const CHANCE = 100 / STAR_CHOICES;

const QUIET_STAR: Citation = {
  ref: "Zelikman et al. 2024",
  url: "https://arxiv.org/abs/2403.09629",
  venue: "arXiv",
  preprint: true,
};
const REST_EM: Citation = {
  ref: "Singh et al. 2024",
  url: "https://arxiv.org/abs/2312.06585",
  venue: "arXiv",
  preprint: true,
};
const V_STAR: Citation = {
  ref: "Hosseini et al. 2024",
  url: "https://arxiv.org/abs/2402.06457",
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

/** A small legend swatch + label. */
function Key({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3 w-3 rounded-sm ${className}`} aria-hidden="true" />
      {label}
    </span>
  );
}

/** One stage of the loop diagram. */
function Stage({ tone, title, sub }: { tone: string; title: string; sub: string }) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg border-l-4 bg-surface-raised p-2.5 ${tone}`}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

const STATUS_TONE = {
  verified: "bg-correct",
  rationalized: "bg-compute",
  wrong: "bg-wrong",
  unsolved: "bg-grid",
} as const;

export function Page12() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const paper = curves.starCqa;
  const p = paper.fit!.params;

  const [history, setHistory] = useState<StarIteration[]>(() => [starBase(POOL)]);
  const [rationalize, setRationalize] = useState(false);
  const [filter, setFilter] = useState(true);

  const iter = history.length - 1;
  const now = history[iter];
  const done = iter >= STAR_MAX_ITERS;
  const trainSize = now.verified + now.rationalized + now.wrong;

  const runIteration = () => {
    recordInteraction(PAGE_N);
    setHistory((h) => [...h, starStep(POOL, h[h.length - 1], { filter, rationalize })]);
  };
  const reset = () => {
    recordInteraction(PAGE_N);
    setHistory([starBase(POOL)]);
  };

  const bars = [
    { label: "GPT-J, few-shot, answer only", value: p.fewShotDirect, tone: "bg-grid", note: "no reasoning, no training" },
    { label: "GPT-J, few-shot CoT", value: p.fewShotCot, tone: "bg-grid", note: "reasons, learns nothing" },
    { label: "GPT-J fine-tuned on human answers", value: p.gptjFinetuned, tone: "bg-grid", note: "the whole labelled training set" },
    { label: "STaR without rationalization", value: p.starNoRationalization, tone: "bg-compute", note: `its own rationales for ${p.trainDataNoRationalization}% of the set` },
    { label: "STaR", value: p.star, tone: "bg-correct", note: `rationalization reaches ${p.trainDataRationalization}% of the set` },
    { label: "GPT-3 (30× larger) fine-tuned", value: p.gpt3Finetuned, tone: "bg-grid", note: "the yardstick: 175B vs 6B" },
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
        Everything in the toolbox so far spends its compute at answer time — and then throws the
        thinking away. But a chain that reached a <em>verified</em> answer is a worked solution the
        model just wrote for itself: training data no human had to author.{" "}
        <strong className="text-ink">STaR</strong> closes that loop —{" "}
        <strong className="text-ink">generate rationales, keep the ones that reach the right
        answer, fine-tune on them, repeat</strong> — so the model studies its own successful
        reasoning and gets <em>permanently</em> better.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the loop, run by hand */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Run the loop
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              seeded illustrative mechanism · no live model
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            {/* the loop itself */}
            <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center" aria-hidden="true">
              <Stage tone="border-ink" title="generate" sub="one rationale per problem" />
              <span className="shrink-0 self-center text-ink-muted">→</span>
              <Stage
                tone={filter ? "border-correct" : "border-wrong"}
                title={filter ? "filter" : "filter (off)"}
                sub={filter ? "keep it only if the answer checks" : "keep everything, right or wrong"}
              />
              <span className="shrink-0 self-center text-ink-muted">→</span>
              <Stage tone="border-compute" title="fine-tune" sub="base model, on what survived" />
              <span className="shrink-0 self-center text-ink-muted">↺</span>
            </div>

            <p className="text-sm text-ink">
              Sixty problems, easy on the left, hard on the right. Each pass, the model writes a
              rationale for every one; the answer key keeps those that land; the base model is
              fine-tuned on the survivors. The ratchet: a slightly better model writes correct
              rationales for slightly <em>harder</em> problems — a training set it could not have
              written last time.
            </p>

            {/* controls */}
            <div className="grid gap-3 border-t border-dashed border-grid pt-3 sm:grid-cols-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={runIteration}
                  disabled={done}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  {done ? "budget spent" : `Run iteration ${iter + 1} ▸`}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink"
                >
                  Reset ↺
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <div className={filter ? "" : "pointer-events-none opacity-40"}>
                  <Toggle
                    label="Rationalization (hint the missed ones)"
                    checked={filter && rationalize}
                    onChange={(v) => {
                      setRationalize(v);
                      recordInteraction(PAGE_N);
                    }}
                  />
                </div>
                <Toggle
                  label="Correctness filter (the answer key)"
                  checked={filter}
                  onChange={(v) => {
                    setFilter(v);
                    recordInteraction(PAGE_N);
                  }}
                />
              </div>
            </div>
            {!filter ? (
              <p className="rounded border-l-4 border-wrong bg-wrong/10 p-2 text-sm text-ink">
                No answer key: every rationale trains, right or wrong — and rationalization is
                impossible, because a hint requires knowing the answer. Keep iterating.
              </p>
            ) : null}

            {/* readouts */}
            <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
              <BigNumber
                value={now.accuracy}
                suffix="%"
                tone={now.wrong > 0 ? "wrong" : "correct"}
                label={`held-out accuracy after iteration ${iter}`}
              />
              <div className="flex min-w-0 flex-col gap-2">
                <div
                  className="flex flex-wrap gap-1"
                  role="img"
                  aria-label={`The training pool after iteration ${iter}: ${now.verified} problems contributed a verified rationale, ${now.rationalized} a rationale written backwards from the given answer, ${now.wrong} a wrong rationale kept because the filter is off, and ${STAR_POOL - trainSize} contributed nothing.`}
                >
                  {now.status.map((s, i) => (
                    <span key={i} className={`h-3 w-3 rounded-sm ${STATUS_TONE[s]}`} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  <Key className="bg-correct" label={`verified rationale (${now.verified})`} />
                  <Key className="bg-compute" label={`rationalized from a hint (${now.rationalized})`} />
                  <Key className="bg-wrong" label={`wrong, but kept (${now.wrong})`} />
                  <Key className="bg-grid" label={`not in the set (${STAR_POOL - trainSize})`} />
                </div>
                <p className="text-xs text-ink-muted">
                  this iteration&apos;s training set: {trainSize} rationales · easy → hard
                </p>
              </div>
            </div>

            <LineChart
              title={`Held-out accuracy across ${iter} self-improvement iterations`}
              points={history.map((s, i) => ({ x: i, y: s.accuracy }))}
              xDomain={[0, STAR_MAX_ITERS]}
              yDomain={[0, 100]}
              xLabel="iteration"
              yLabel="accuracy (%)"
              referenceY={CHANCE}
              referenceLabel="guessing (1 in 5)"
              markPoints
              width={560}
              height={230}
            />

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              The climb saturates: problems the model can never solve unaided never enter the
              training set, so the loop plateaus below the ceiling.{" "}
              <strong>Rationalization</strong> is STaR&apos;s answer — show the model the answer it
              missed and let it reason <em>backwards</em>; the rationale, not the answer, joins the
              set, and the plateau lifts. The correct answer acts as the external signal deciding
              what the model may study.
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Run to the plateau, reset, and climb again with rationalization on.</p>
          <p>
            Then switch the correctness filter off at the top of a climb, keep iterating, and watch
            the loop eat its own mistakes.
          </p>
        </Note>

        {/* Step 2 — the paper's result */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. What the loop bought
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Zelikman et al. 2022 · CommonsenseQA
            </span>
          </h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`CommonsenseQA accuracy: GPT-J few-shot direct ${p.fewShotDirect} percent, GPT-J few-shot chain of thought ${p.fewShotCot} percent, GPT-J fine-tuned on human answers ${p.gptjFinetuned} percent, STaR without rationalization ${p.starNoRationalization} percent, STaR ${p.star} percent, GPT-3 thirty times larger fine-tuned ${p.gpt3Finetuned} percent.`}
            >
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-56 shrink-0 text-ink-muted">
                    {b.label}
                    <span className="block text-xs text-ink-muted">{b.note}</span>
                  </span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <figcaption className="text-sm text-ink-muted">
              GPT-J has 6B parameters, and nobody wrote it a single worked solution. Fine-tuned on
              rationales it generated and filtered itself, it lands at{" "}
              <strong className="text-ink">{p.star}%</strong> — beside{" "}
              <strong className="text-ink">{p.gpt3Finetuned}%</strong> for a GPT-3{" "}
              <strong className="text-ink">30× its size</strong> fine-tuned on the full
              human-labelled training set. And the gap above the {p.gptjFinetuned}% answer-only
              fine-tune is the page&apos;s point: the value was never the answers — it was{" "}
              <em>training on the reasoning</em>.
            </figcaption>
          </figure>
        </section>

        <Note kicker="References">
          <p>
            Zelikman et al. 2022, <em>STaR: Bootstrapping Reasoning With Reasoning</em>, NeurIPS
            2022.
          </p>
        </Note>

        {/* Step 3 — lineage and fine print */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The ancestor, and the fine print</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-base text-ink">
              <strong>Read the loop as reinforcement learning.</strong> Sampled attempts, a
              verifiable reward (the answer key), improvement on the successes:{" "}
              <em>generate → filter → train</em> is the conceptual ancestor of the
              RL-from-verifiable-rewards recipe behind today&apos;s reasoning models — o1, R1 —
              where Act 3 picks up the story. Its descendants each fix one gap: Quiet-STaR moves
              the loop inside, learning to think before <em>every</em> token; ReST-EM formalizes
              generate-filter-train as expectation-maximization and scales it; V-STaR keeps the
              discarded wrong rationales too, and trains a verifier on the contrast.
            </div>
            <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-base text-ink">
              <strong>The filter is load-bearing.</strong> You watched it: with the answer key
              removed, every mistake trains, the next generation imitates the last one&apos;s
              errors, and accuracy sinks toward chance —{" "}
              <strong className="text-wrong">model collapse</strong>. A model can only pull itself
              up by its own rationales while a <em>reliable external signal</em> decides what
              enters the training set. Hold onto that: it returns when the reward, not the answer
              key, is the filter.
            </div>
          </div>
        </section>

        <Note kicker="References">
          <p>
            Zelikman et al. 2024, <em>Quiet-STaR</em> · Singh et al. 2024, <em>Beyond Human Data
            (ReST-EM)</em> · Hosseini et al. 2024, <em>V-STaR</em>.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={paper.citation} />
        <CitationBadge citation={QUIET_STAR} />
        <CitationBadge citation={REST_EM} />
        <CitationBadge citation={V_STAR} />
      </div>
      <p className="text-xs text-ink-muted">
        the loop in step 1 is a seeded, ILLUSTRATIVE mechanism, not a digitized curve: no published
        result fixes what &ldquo;60 problems&rdquo; or the hint boost mean numerically · what is
        cited is quoted verbatim in step 2 (Zelikman et al. 2022, Table 1, CommonsenseQA dev) ·
        the shapes the mechanism teaches — bootstrapping to a plateau, rationalization lifting it —
        are the paper&apos;s reported behaviour, and the collapse without a correctness filter is
        the standard failure mode of self-training on unfiltered model output · every trajectory
        above is pinned in the test suite
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
