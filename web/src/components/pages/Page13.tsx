"use client";

/**
 * Page 13, "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve".
 * Page 12 closed on a promise — o1 keeps the loop's shape and drops the
 * disguise — and this page holds it to that promise with abstractions, not
 * announcement transcription. The reader should leave with three things the
 * literature never states in one place: the loop-diff (section 1), the
 * unified two-knob law (section 2), and the visibility boundary (section 4).
 *
 * Section 1 renders page 12's ten-line listing (shared via lib/starListing —
 * never forked, so the two pages cannot drift) behind a "drop the disguise"
 * toggle: four lines rewritten (plateau exit → compute budget, one greedy
 * rollout → k sampled chains, filter → explicit reward, finetune-from-base →
 * reinforce-in-place) and three struck (the hint branch — sampling explores
 * instead). Honesty is load-bearing: OpenAI confirmed the FRAME — large-scale
 * RL on a long private chain, and its researchers' own LRM definition — but
 * never published the algorithm, so the rewrite is labelled rumor in the h2
 * badge, the caption, and the footer. The callout under the listing carries
 * the page's two build-ons: no human anywhere in the loop (vs RLHF), and no
 * draw on page 3's finite stock of human text.
 *
 * Section 2 keeps the two-knob lab and re-aims its copy at page 11's idiom
 * ("model size picks your curve; test-time compute slides you along it") with
 * the curve-picker swapped for RL. The training slider translating the whole
 * line IS the claim; the missing-RL delta is the protagonist; the equality
 * law(2,0) = law(0,2) is the Try-it note's punchline (thinking cannot spend
 * training's decades). The unlabeled-axis fidelity note is unchanged: the
 * slope is authored, the anchors verbatim.
 *
 * Section 3 is deliberately not a scoreboard — the old GPT-4o/o1/o3 table
 * read as product chronology and regurgitated announcement numbers, and was
 * reviewed out. The waterfall stays (Act 2's tricks as a second storey on the
 * learned chain; rows are mechanisms, model names demoted to parentheses),
 * and o3 appears exactly once, as the law applied again, inside the paper's
 * own generality ablation: o1-ioi's hand-engineered contest pipeline vs an
 * early o3's unaided gold (El-Kishky et al. 2025).
 *
 * Section 4 replaces the old boundary diagram (three visual systems, no
 * shared grammar) with a ledger — what exists / who can read it / who pays —
 * so the asymmetry is a column the eye can scan. The three closing blocks
 * (the case for hiding, the price, the R1 handoff) are kept verbatim and in
 * place by review request.
 *
 * Anchored to data/o1-scaling.json and data/o3-preview.json; the law and the
 * printed anchors are pinned in frontier.test.ts, the page's structure in
 * Page13.test.tsx.
 */

import { useMemo, useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { Cite, RefItem } from "@/components/Cite";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { twoAxisAccuracy } from "@/lib/frontier";
import { STAR_LINES } from "@/lib/starListing";
import { useStore } from "@/store/useStore";

const PAGE_N = 13;

/** Page 13's references, numbered in order of first appearance. */
const REF = { announce: 1, competitive: 2, o3preview: 3, systemCard: 4 } as const;

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

/**
 * Section 1's diff against the shared STaR listing, indexed line for line.
 * "same" lines survive the rewrite untouched, "changed" lines carry the
 * rumored replacement, "dropped" lines are struck — the hint branch, made
 * redundant by sampled exploration. The rewrite is a reconstruction, not a
 * publication; the copy around it says so.
 */
type RlPatch =
  | { kind: "same"; note?: React.ReactNode }
  | { kind: "changed"; code: React.ReactNode; note: React.ReactNode; tone: string }
  | { kind: "dropped"; note?: React.ReactNode };

const RL_PATCH: RlPatch[] = [
  { kind: "same", note: "unchanged — one pretrained model, still its own teacher" },
  {
    kind: "changed",
    code: "loop: while the compute budget lasts",
    note: "the exit is a budget now, not a plateau — section 2's training axis is this line",
    tone: "border-compute",
  },
  { kind: "dropped", note: "no survivor pile — every chain carries its reward straight into the update" },
  { kind: "same", note: "unchanged — questions with checkable answers are still the only supervision" },
  {
    kind: "changed",
    code: "r₁…r_k, ŷ₁…ŷ_k ← M(x)",
    note: "k sampled chains per problem — exploration by sampling, not one greedy try",
    tone: "border-compute",
  },
  {
    kind: "changed",
    code: "rewardᵢ ← check(ŷᵢ, y)",
    note: "page 12's filter, promoted to an explicit reward — still the answer key, still graded for free",
    tone: "border-correct",
  },
  { kind: "dropped" },
  {
    kind: "dropped",
    note: "the hint branch goes — with k chains exploring, hindsight is not needed",
  },
  { kind: "dropped" },
  {
    kind: "changed",
    code: "M ← reinforce(M, rewards)",
    note: "update the current model, not the base — this round's gains compound into the next",
    tone: "border-compute",
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

/**
 * One line of section 1's listing: numbered code on the left, intuition on
 * the right, page 12's rendering with a struck state added for the diff.
 */
function CodeLine({
  n,
  indent,
  code,
  note,
  tone,
  struck,
}: {
  n: number;
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
  tone?: string;
  struck?: boolean;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-0.5 sm:grid-cols-[auto_minmax(0,20rem)_minmax(0,1fr)] sm:gap-x-4">
      <span className="w-5 select-none text-right font-mono text-xs tabular-nums text-ink-muted" aria-hidden="true">
        {n}
      </span>
      <span className={`flex items-baseline font-mono text-sm ${struck ? "text-ink-muted" : "text-ink"}`}>
        {indent > 0 ? (
          <span className="whitespace-pre" aria-hidden="true">
            {"  ".repeat(indent)}
          </span>
        ) : null}
        <code
          className={`whitespace-pre rounded border-l-4 px-1 ${
            tone ? `bg-surface-raised ${tone}` : "border-transparent"
          } ${struck ? "line-through" : ""}`}
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

export function Page13() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [rl, setRl] = useState(false);

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
      label: "no learned chain",
      note: "one instant answer from a strong LLM (GPT-4o)",
      start: 0,
      gain: P.gpt4oAime,
      total: P.gpt4oAime,
      tone: "bg-grid",
      base: true,
    },
    {
      label: "the learned chain",
      note: "one long private chain, trained in by section 1's loop",
      start: P.gpt4oAime,
      gain: chainGain,
      total: P.o1Pass1,
      tone: "bg-compute",
      base: false,
    },
    {
      label: "+ page 7's voting",
      note: "majority across 64 chains",
      start: P.o1Pass1,
      gain: voteGain,
      total: P.o1Cons64,
      tone: "bg-compute",
      base: false,
    },
    {
      label: "+ page 8's re-ranker",
      note: "a learned judge picks from 1000 chains",
      start: P.o1Cons64,
      gain: rerankGain,
      total: P.o1Rerank1000,
      tone: "bg-correct",
      base: false,
    },
  ];

  const ledger = [
    {
      what: "The raw chain of thought",
      detail: "the tokens that do the work — unrestricted, left untrained",
      reads: "the lab only",
      pays: "you — every thinking token billed, sight unseen",
      paysWrong: true,
    },
    {
      what: "A model-written summary",
      detail: "a paraphrase written after the fact",
      reads: "you — it is all you ever see",
      pays: "—",
      paysWrong: false,
    },
    {
      what: "The monitor's verdict",
      detail: "a deception check that reads the raw chain",
      reads: "the lab only",
      pays: "—",
      paysWrong: false,
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
        <strong className="text-ink">o1</strong> trained it in — and kept the recipe. Its
        signature is <strong className="text-ink">a curve with two compute axes</strong>: how much
        of the score did the training buy, and how much did the thinking?
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the loop-diff */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            1. The human leaves the loop
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              confirmed frame · rumored recipe
            </span>
          </h2>
          <p className="text-ink-muted">
            Page 12 closed on a promise: same shape, disguise dropped. OpenAI confirmed the
            frame — o1 is trained with large-scale reinforcement learning to think in a long
            private chain
            <Cite n={REF.announce} /> — and its own researchers later named the category:
            &ldquo;large reasoning models (LRMs): language models trained via reinforcement
            learning to &lsquo;reason&rsquo; and &lsquo;think through&rsquo; extended chains of
            thought&rdquo;.
            <Cite n={REF.competitive} /> The algorithm itself was never published.
          </p>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              So here is the claim at the only honest resolution: the ten lines you ran on page
              12, and the smallest rewrite that turns them into that description.{" "}
              <strong className="text-ink">Flip the switch and watch which lines survive.</strong>
            </p>

            <div className="border-t border-dashed border-grid pt-3">
              <Toggle
                label="Drop the disguise (the rumored rewrite)"
                checked={rl}
                offLabel="STaR"
                onLabel="RL"
                onChange={(v) => {
                  setRl(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <figure
              className="m-0 flex flex-col gap-2"
              aria-label={
                rl
                  ? "The rumored reasoner rewrite of STaR's pseudocode: the loop runs while the compute budget lasts, k chains are sampled per problem, the answer-key filter becomes an explicit reward, the hint branch is deleted, and the current model is reinforced in place instead of fine-tuning the base model."
                  : "STaR pseudocode, as on page 12: generate a rationale per problem, keep it if the answer checks out, otherwise retry with the answer as a hint, then fine-tune the base model on everything kept, and repeat."
              }
            >
              <div className="flex flex-col">
                {STAR_LINES.map((l, i) => {
                  const patch = RL_PATCH[i];
                  if (!rl || patch.kind === "same") {
                    return (
                      <CodeLine
                        key={i}
                        n={i + 1}
                        indent={l.indent}
                        code={l.code}
                        note={rl ? patch.note : undefined}
                      />
                    );
                  }
                  if (patch.kind === "dropped") {
                    return (
                      <CodeLine
                        key={i}
                        n={i + 1}
                        indent={l.indent}
                        code={l.code}
                        note={patch.note}
                        tone="border-wrong"
                        struck
                      />
                    );
                  }
                  return (
                    <CodeLine
                      key={i}
                      n={i + 1}
                      indent={l.indent}
                      code={patch.code}
                      note={patch.note}
                      tone={patch.tone}
                    />
                  );
                })}
              </div>
              <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
                {rl ? (
                  <>
                    Four lines rewritten (highlighted), three struck. This column is a
                    reconstruction — the community&apos;s, matched to page 12&apos;s
                    expert-iteration lineage — <strong className="text-ink">rumor, not
                    record</strong>: OpenAI confirmed the frame and kept the algorithm.
                  </>
                ) : (
                  <>
                    Page 12&apos;s ten lines, verbatim — the two pages render one shared listing,
                    so this left-hand side is exactly the loop you already ran.
                  </>
                )}
              </figcaption>
            </figure>

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              Now read what is <strong>not</strong> there: a human. The industry&apos;s default
              post-training loop, RLHF, pays people to judge outputs; here nobody writes an
              example and nobody grades one — the model authors the reasoning, the answer key
              scores it, and both scale with compute rather than headcount. And the training set
              never touches page 3&apos;s finite stock of human text: the model writes its own
              curriculum, fresh every round.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.announce} href="https://openai.com/index/learning-to-reason-with-llms/" preprint>
            OpenAI 2024, <em>Learning to Reason with LLMs</em>.
          </RefItem>
          <RefItem n={REF.competitive} href="https://arxiv.org/abs/2502.06807" preprint>
            El-Kishky et al. 2025, <em>Competitive Programming with Large Reasoning Models</em>.
          </RefItem>
        </Note>

        {/* Step 2 — the two-axis lab */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            2. One law, two knobs
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored redrawing · anchors verbatim
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Page 11&apos;s law: <em>model size picks your curve; test-time compute slides you
              along it.</em> o1&apos;s announcement charts are the same picture with the
              curve-picker swapped — <strong className="text-ink">RL training picks your curve
              now</strong>
              <Cite n={REF.announce} /> — and both are log-linear: accuracy against the{" "}
              <em>logarithm</em> of compute, whichever axis it arrives on.
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
                  The training slider translates the whole line rather than moving a point along
                  it — that is the swap, drawn.{" "}
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
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Thinking slides you along the curve; only training
              lifts it.</strong>{" "}
              The knobs compound, they do not substitute — and the lift is paid for in a currency
              page 3&apos;s wall does not price: chains the model writes itself, not the finite
              stock of human text.
            </p>
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

        <Note kicker="Try it">
          <p>
            Drag the training slider to ×1 and push thinking to ×100: you land at {P.intercept}% —
            exactly where the full run <em>starts</em> at ×1 thinking.
          </p>
          <p>
            That equality is the law: a decade of thinking equals a decade of training, and
            neither knob can spend the other&apos;s decades.
          </p>
        </Note>

        {/* Step 3 — the second storey, and the generality ablation */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">3. The toolbox becomes a second storey</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Act 2 did not become obsolete — it became the second storey. Each increment below is
              one of its mechanisms, stacked on top of the learned chain, on competition maths
              (AIME 2024):
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`AIME 2024 accuracy waterfall: a strong LLM with no learned chain starts at ${P.gpt4oAime} percent; the learned chain adds ${chainGain} points to reach ${P.o1Pass1}; page 7's majority voting across 64 chains adds ${voteGain} to reach ${P.o1Cons64}; page 8's learned re-ranker over 1000 chains adds ${rerankGain} to reach ${P.o1Rerank1000}.`}
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

          <h3 className="text-lg font-semibold text-ink">
            One recipe, no domain tricks
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              El-Kishky et al. 2025 · IOI 2024
            </span>
          </h3>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Is the recipe doing the work, or benchmark-specific tuning? OpenAI ran the ablation
              itself. For the 2024 International Olympiad in Informatics it built{" "}
              <strong className="text-ink">o1-ioi</strong> — o1 plus hand-engineered,
              contest-specific inference strategies. Live, with the hand-crafted pipeline, it
              placed in the 49th percentile; gold required relaxed constraints. An early{" "}
              <strong className="text-ink">o3</strong> — the same general recipe with both knobs
              turned further, no contest tricks at all — took gold outright.
              <Cite n={REF.competitive} />
            </p>
            <p className="text-sm text-ink-muted">
              That later checkpoint is the only o3 this page needs: both knobs turned further,
              and <strong className="text-ink">the law held</strong> — on the announcement&apos;s
              own preview scoring, competition maths moved {P.o1Pass1}% → {Q.o3Aime}%.
              <Cite n={REF.o3preview} /> The paper&apos;s conclusion, verbatim: scaling
              &ldquo;general-purpose reinforcement learning, rather than relying on
              domain-specific techniques, offers a robust path toward state-of-the-art AI&rdquo;
              in reasoning domains.
              <Cite n={REF.competitive} />
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.o3preview} href="https://arcprize.org/blog/oai-o3-pub-breakthrough" preprint>
            OpenAI 2024, <em>OpenAI o3 preview</em> (via ARC Prize).
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

          <div className="overflow-x-auto rounded-lg border border-grid bg-surface p-4">
            <table className="w-full min-w-[30rem] text-sm">
              <caption className="mb-2 caption-top text-left text-sm text-ink-muted">
                The boundary, as a ledger — read the asymmetry down each column.
              </caption>
              <thead>
                <tr className="border-b border-grid text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th scope="col" className="py-1.5 pr-3 font-semibold">What exists</th>
                  <th scope="col" className="py-1.5 pr-3 font-semibold">Who can read it</th>
                  <th scope="col" className="py-1.5 font-semibold">Who pays for it</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((r) => (
                  <tr key={r.what} className="border-b border-dashed border-grid align-top last:border-0">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <strong className="text-ink">{r.what}</strong>
                      <span className="block text-xs text-ink-muted">{r.detail}</span>
                    </th>
                    <td className="py-2 pr-3 text-ink-muted">{r.reads}</td>
                    <td className={`py-2 ${r.paysWrong ? "text-wrong" : "text-ink-muted"}`}>
                      {r.pays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-ink-muted">
              The monitor is not idle: on ~100k synthetic prompts it flagged 0.17% of responses as
              deceptive — a number only the lab could ever have produced, because only the lab can
              read the column it audits.
              <Cite n={REF.systemCard} />
            </p>
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
        <strong className="text-ink">Simulated</strong> — the section 2 curve is a redrawing of an
        unlabeled-axis figure, preserving its log-linear shape and two-decade span; the absolute
        compute units (and the +{P.slopePerDecade}-per-decade slope) are the redrawing&apos;s, not
        published values. Section 1&apos;s rewritten column is a reconstruction, not a
        publication: OpenAI confirmed the frame and never released the algorithm — rumor,
        labelled as such. · <strong className="text-ink">Cited</strong> — every named number on
        this page is verbatim from the sources and pinned as such in the test suite.
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
