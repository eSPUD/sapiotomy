"use client";

/**
 * Page 12, "Teaching Models to Reason: STaR and Self-Improvement". Every tool
 * in the act so far spends its compute at answer time and throws the reasoning
 * away. STaR (Zelikman et al. 2022) is the bridge from inference-time back to
 * train-time: a chain that reached a verified answer is a worked solution the
 * model wrote for itself — training data. Generate, keep what checks out,
 * fine-tune, repeat.
 *
 * Section 1 is the loop itself (lib/star.ts), run iteration by iteration. Each
 * press runs one training round, then a held-out test, and the readouts are
 * split into labelled Training/Test panels so the reader always knows which
 * regime a number belongs to — the chart's two lines carry the same labels.
 * The mechanism is illustrative and seeded, not a digitized curve: 60 problems with
 * fixed per-problem solvability thresholds, so the solved set grows exactly
 * when skill grows and every run is reproducible. Three behaviours to feel:
 * the ratchet (each round's better model writes correct rationales for harder
 * problems), the plateau (problems the model can never solve unaided never
 * enter the set — the chart plots |D_n| beside accuracy so the stall is
 * visible, not asserted), and rationalization lifting the plateau. The filter
 * toggle is the page's flag for Act 3: switch the answer key off and the loop
 * trains on its own mistakes until accuracy sinks toward chance.
 *
 * Section 2 is the paper's Table 1 (data/star-cqa.json), quoted verbatim: 6B
 * GPT-J plus its own filtered rationales lands at 72.5% on CommonsenseQA —
 * past a 23x larger LaMDA doing few-shot CoT, beside a 30x larger GPT-3
 * fine-tuned on the full human-labelled training set.
 *
 * Section 3 is the loop written down: the paper's Algorithm 1 compressed to
 * ten annotated pseudocode lines, then read a second time as reinforcement
 * learning in disguise (sample from the policy, binary reward, imitate what
 * scored). The intuition blocks carry the content the papers don't spell out:
 * why self-training isn't circular (the filter distills lucky samples into
 * reliable skill), rationalization as hindsight learning and its failure mode
 * (the filter checks answers, not reasoning), and Quiet-STaR as the one-move
 * generalization (every sentence has an answer key: the text that follows).
 * The V-STaR/ReST^EM lineage is deliberately omitted — technical intuition
 * over history — and the closing card hands off to the Frontier Reasoners
 * pages: o1-class models run this same loop with the RL made explicit.
 *
 * Sidenote convention as on page 2: one "Try it" note beside the interactive,
 * numbered References notes (Cite/RefItem) beside the steps that use them,
 * citation badges + provenance footnote at the bottom.
 */

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
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

/** Page 12's references, numbered in order of first appearance. */
const REF = { star: 1, quietStar: 2 } as const;

const QUIET_STAR: Citation = {
  ref: "Zelikman et al. 2024",
  url: "https://arxiv.org/abs/2403.09629",
  venue: "arXiv",
  preprint: true,
};

/**
 * Section 3's listing — STaR's Algorithm 1 compressed to ten lines. Each line
 * carries an indent level rendered outside the highlighted span, so a tone
 * border sits at the code's own column; tones tie the filter line and the
 * rationalization branch to section 1's legend colours. Structural lines carry
 * no annotation.
 */
const CODE_LINES: {
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
  tone?: string;
}[] = [
  {
    indent: 0,
    code: (
      <>
        M ← M<sub>0</sub>
      </>
    ),
    note: "one model is both student and teacher",
  },
  { indent: 0, code: "loop:" },
  { indent: 1, code: "kept ← ∅" },
  {
    indent: 1,
    code: "for (x, y) in problems:",
    note: "the only supervision that exists: answers, never reasoning",
  },
  { indent: 2, code: "r, ŷ ← M(x)", note: "in RL terms: sample from the current policy" },
  {
    indent: 2,
    code: "if ŷ = y: keep (x, r, y)",
    note: "in RL terms: a binary reward, checked for free by section 1's answer key",
    tone: "border-correct",
  },
  { indent: 2, code: "else:" },
  {
    indent: 3,
    code: "r′, ŷ′ ← M(x, hint = y)",
    note: "hindsight: knowing the destination makes the route easier to find",
    tone: "border-compute",
  },
  {
    indent: 3,
    code: "if ŷ′ = y: keep (x, r′, y)",
    note: "the hint is stripped, so the model trains as if it had found the route unaided",
    tone: "border-compute",
  },
  {
    indent: 1,
    code: (
      <>
        M ← finetune(M<sub>0</sub>, kept)
      </>
    ),
    note: "restart from the base model every round, so early quirks never compound into the weights",
  },
];

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

/** An arrow between stages, matching section 1's strip. */
function Arrow({ glyph = "→" }: { glyph?: string }) {
  return <span className="shrink-0 self-center text-ink-muted">{glyph}</span>;
}

/**
 * One line of section 3's listing: numbered code on the left, intuition on the
 * right. On narrow screens the annotation stacks under the code.
 */
function CodeLine({
  n,
  indent,
  code,
  note,
  tone,
}: {
  n: number;
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-0.5 sm:grid-cols-[auto_minmax(0,20rem)_minmax(0,1fr)] sm:gap-x-4">
      <span className="w-5 select-none text-right font-mono text-xs tabular-nums text-ink-muted" aria-hidden="true">
        {n}
      </span>
      <span className="flex items-baseline font-mono text-sm text-ink">
        {indent > 0 ? (
          <span className="whitespace-pre" aria-hidden="true">
            {"  ".repeat(indent)}
          </span>
        ) : null}
        <code
          className={`whitespace-pre rounded border-l-4 px-1 ${
            tone ? `bg-surface-raised ${tone}` : "border-transparent"
          }`}
        >
          {code}
        </code>
      </span>
      {note ? (
        <span className="col-start-2 text-xs text-ink-muted sm:col-start-3">{note}</span>
      ) : null}
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
    { label: "LaMDA 137B, few-shot CoT", value: p.fewShotCotLamda, tone: "bg-grid", note: "23× larger, same recipe" },
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
        A model writes its own reasoning, an answer key discards what&apos;s wrong, and the
        survivors become its next training set.{" "}
        <strong className="text-ink">What happens when you take the answer key away?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Section 1 — the loop, run by hand */}
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
              <Arrow />
              <Stage
                tone={filter ? "border-correct" : "border-wrong"}
                title={filter ? "filter" : "filter (off)"}
                sub={filter ? "keep it only if the answer checks" : "keep everything, right or wrong"}
              />
              <Arrow />
              <Stage tone="border-compute" title="fine-tune" sub="base model, on what survived" />
              <Arrow glyph="↺" />
            </div>

            <p className="text-sm text-ink">
              This is <strong>STaR</strong>&apos;s loop.
              <Cite n={REF.star} /> It still needs a dataset — questions <em>with correct
              answers</em> — but nobody has to write the reasoning; the model authors that itself.
              Sixty problems, easy on the left, hard on the right. Each press of Run does both
              halves: one <strong>training</strong> round — the model writes a rationale for every
              problem, the answer key keeps those that land, the base model is fine-tuned on the
              survivors — and then a <strong>test</strong>, measuring the new model on held-out
              problems the loop never touches. The panels below keep the two apart. The ratchet: a
              slightly better model writes correct rationales for slightly <em>harder</em>{" "}
              problems — a training set it could not have written last time.
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
              <p className="text-xs text-ink-muted sm:col-span-2">
                Filter alone is the paper&apos;s ablation; filter <em>plus</em> rationalization is
                full STaR, the algorithm section 3 writes down; filter off is the degenerate loop.
              </p>
            </div>
            {!filter ? (
              <p className="rounded border-l-4 border-wrong bg-wrong/10 p-2 text-sm text-ink">
                No answer key: every rationale trains, right or wrong — and rationalization is
                impossible, because a hint requires knowing the answer. Keep iterating.
              </p>
            ) : null}

            {/* readouts — the two regimes, kept apart and labelled */}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
              <div className="flex min-w-0 flex-col gap-2 rounded border border-dashed border-grid p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Training · what this round produced
                </p>
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
                  fine-tuned on {trainSize} rationales this round · problems easy → hard
                </p>
              </div>
              <div className="flex flex-col justify-center gap-1 rounded border border-dashed border-grid p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Test · how good did it get?
                </p>
                <BigNumber
                  value={now.accuracy}
                  suffix="%"
                  tone={now.wrong > 0 ? "wrong" : "correct"}
                  label={`on held-out problems, after iteration ${iter}`}
                />
              </div>
            </div>

            <LineChart
              title={`Train, then test — both lines after each of ${iter} iterations`}
              points={history.map((s, i) => ({ x: i, y: s.accuracy }))}
              primaryLabel="test: held-out accuracy"
              secondary={{
                points: history.map((s, i) => ({
                  x: i,
                  y: ((s.verified + s.rationalized + s.wrong) / STAR_POOL) * 100,
                })),
                label: "training: set size |Dₙ| (% of pool)",
              }}
              secondaryFaint
              xDomain={[0, STAR_MAX_ITERS]}
              yDomain={[0, 100]}
              xLabel="iteration"
              yLabel="accuracy · |Dₙ| (%)"
              referenceY={CHANCE}
              referenceLabel="guessing (1 in 5)"
              markPoints
              width={560}
              height={230}
            />

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              The climb saturates, and the fainter line shows why: problems the model can never
              solve unaided never enter the training set, so |D<sub>n</sub>| stalls and the
              accuracy plateaus with it. <strong>Rationalization</strong> is STaR&apos;s answer —
              show the model the answer it missed and let it reason <em>backwards</em>; the
              rationale, not the answer, joins the set, and the plateau lifts. The correct answer
              acts as the external signal deciding what the model may study. One caveat travels
              with it: rationalization helped substantially on CommonsenseQA and dramatically on
              arithmetic, but did not substantially improve GSM8K.
              <Cite n={REF.star} />
            </p>

            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Calibration.</strong> The anchors this mechanism
              reproduces: it starts near 35% (GPT-J few-shot CoT: 36.6%), plateaus near 68%
              without rationalization (STaR&apos;s 68.8%), bottoms out at the 20% floor of
              five-way multiple choice, and its plateau training set covers 60% of the pool
              (the paper generates rationales for 69.7% of its training set).
              <Cite n={REF.star} /> One simplification: the paper seeds generation with a few-shot
              prompt of example rationales; here that seed is simply the model&apos;s starting
              skill.
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>
            Run to the plateau and watch the fainter |D<sub>n</sub>| line stall at the same time
            accuracy does. Reset, and climb again with rationalization on.
          </p>
          <p>
            Then switch the correctness filter off at the top of a climb, keep iterating, and watch
            the loop eat its own mistakes.
          </p>
        </Note>

        {/* Section 2 — the paper's result */}
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
              aria-label={`CommonsenseQA accuracy: GPT-J few-shot direct ${p.fewShotDirect} percent, GPT-J few-shot chain of thought ${p.fewShotCot} percent, LaMDA 137B few-shot chain of thought ${p.fewShotCotLamda} percent, GPT-J fine-tuned on human answers ${p.gptjFinetuned} percent, STaR without rationalization ${p.starNoRationalization} percent, STaR ${p.star} percent, GPT-3 thirty times larger fine-tuned ${p.gpt3Finetuned} percent.`}
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
              <strong className="text-ink">{p.star}%</strong> — clear past the{" "}
              {p.fewShotCotLamda}% of a LaMDA <strong className="text-ink">23× its size</strong>{" "}
              prompted the same way, beside <strong className="text-ink">{p.gpt3Finetuned.toFixed(1)}%</strong>{" "}
              for a GPT-3 <strong className="text-ink">30× its size</strong> fine-tuned on the full
              human-labelled training set.
              <Cite n={REF.star} /> And the gap above the {p.gptjFinetuned}% answer-only
              fine-tune is the page&apos;s point: the value was never the answers — it was{" "}
              <em>training on the reasoning</em>.
            </figcaption>
          </figure>
        </section>

        <Note kicker="References">
          <RefItem n={REF.star} href="https://arxiv.org/abs/2203.14465">
            Zelikman et al. 2022, <em>STaR: Bootstrapping Reasoning With Reasoning</em>, NeurIPS
            2022.
          </RefItem>
        </Note>

        {/* Section 3 — the algorithm, written down and read twice */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The loop, written down</h2>

          <p className="text-sm text-ink">
            The loop you just ran, compressed to ten lines. Read it once as an algorithm. Then
            read it again — the annotations on lines 5 and 6 name what it secretly is.
          </p>

          <figure
            className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4"
            aria-label="STaR pseudocode: generate a rationale per problem, keep it if the answer checks out, otherwise retry with the answer as a hint and keep the survivor with the hint stripped, then fine-tune the base model on everything kept, and repeat."
          >
            <div className="flex flex-col">
              {CODE_LINES.map((l, i) => (
                <CodeLine key={i} n={i + 1} indent={l.indent} code={l.code} note={l.note} tone={l.tone} />
              ))}
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              STaR&apos;s Algorithm 1, compressed.
              <Cite n={REF.star} /> The coloured lines are section 1&apos;s legend: the answer-key
              filter, and the rationalization branch it enables.
            </figcaption>
          </figure>

          <p className="rounded border-l-4 border-grid bg-surface-raised p-3 text-sm text-ink">
            <strong className="text-ink">The algorithm, explained.</strong> Start with a
            pretrained model and a stack of problems whose correct answers you know. There are no
            worked solutions, only the answers. For each problem, the model writes out its
            reasoning and ends with an answer. If that answer matches the key, the reasoning is
            kept. If it misses, the model gets one more try with the correct answer shown as a
            hint; if it now reasons its way there, the reasoning is kept and the hint is deleted
            from the record. Finally, the <em>original</em> pretrained model is fine-tuned on
            everything kept, and the loop starts over with a slightly better model writing the
            next round of reasoning.
          </p>

          <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
            <strong className="text-ink">Reinforcement learning in disguise.</strong> Line 5
            samples from a policy. Line 6 assigns a reward: 1 if the answer checks out, 0
            otherwise. Line 10 raises the probability of whatever earned the reward. No gradient
            ever flows from the reward — it only decides <em>what gets imitated</em> — which makes
            STaR rejection sampling plus imitation: expert iteration where the expert is the model
            itself, on a lucky day. Hold that framing; it is the door the frontier walks through.
          </p>

          <p className="rounded border-l-4 border-grid bg-surface-raised p-3 text-sm text-ink">
            <strong className="text-ink">Why it isn&apos;t circular.</strong> A model training on
            its own output sounds like lifting yourself by your bootstraps. The escape is that
            generation is stochastic: the model <em>sometimes</em> produces a chain of reasoning
            it cannot yet produce <em>reliably</em>. The filter finds those flukes, and
            fine-tuning converts sometimes into always — the loop distills luck into skill. That
            is also exactly why section 1 plateaus: once &ldquo;sometimes&rdquo; hits zero on the
            problems that remain, there is nothing left to distill. Rationalization exists to
            push that boundary out.
          </p>

          <p className="rounded border-l-4 border-wrong bg-surface-raised p-3 text-sm text-ink">
            <strong className="text-ink">Hindsight, and its danger.</strong> Line 8 is hindsight
            learning: knowing the destination makes the route easier to find, so it manufactures
            worked solutions for problems just past the model&apos;s reach. But notice what line 6
            actually checks: the <em>answer</em>, never the <em>reasoning</em>. A wrong argument
            that happens to land on the right answer passes the filter, gets trained on, and next
            round the model produces more of it — STaR&apos;s authors watched scratchpads drift
            toward the meaningless while the answers stayed right, and learning stalled.
            <Cite n={REF.star} /> The loop is only ever as sound as its filter.
          </p>

          <p className="rounded border-l-4 border-grid bg-surface-raised p-3 text-sm text-ink">
            <strong className="text-ink">Quiet-STaR, in one move.</strong> Generalize line 4:
            replace &ldquo;a problem with an answer key&rdquo; with <em>any text at all</em>. The
            model thinks briefly before each token, and a thought is reinforced if it made the
            next few tokens of real text more predictable than they would have been without it.
            <Cite n={REF.quietStar} /> Every sentence has an answer key — the sentence that
            follows it. Same loop, different filter; the opener&apos;s question, answered: you can
            remove the answer key, but something automatic must still decide what gets learned.
          </p>

          <p className="rounded border-l-4 border-compute bg-surface p-4 text-base text-ink">
            o1-class reasoners keep exactly this loop — sample reasoning, score it, reinforce
            what scored — and drop the disguise: the filter becomes an explicit RL reward on
            tasks with checkable answers, and the loop runs at a scale where the model&apos;s own
            sampling, not any dataset, is the training set.{" "}
            <em>The next two pages are what that looks like with the disguise off.</em>
          </p>
        </section>

        <Note kicker="References">
          <RefItem n={REF.quietStar} href="https://arxiv.org/abs/2403.09629">
            Zelikman et al. 2024, <em>Quiet-STaR</em>.
          </RefItem>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={paper.citation} />
        <CitationBadge citation={QUIET_STAR} />
      </div>
      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Simulated</strong> — the loop in section 1 is a seeded
          mechanism, not digitized data. No published result fixes what &ldquo;60 problems&rdquo;
          or the hint boost mean numerically. It reproduces the shapes: bootstrapping to a plateau,
          rationalization lifting it, degeneration without the filter.
        </p>
        <p>
          <strong className="text-ink">Cited</strong> — every figure in section 2 is from Zelikman
          et al. 2022, Table 1, CommonsenseQA dev.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
