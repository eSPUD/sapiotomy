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
 * regime a number belongs to — the Test panel carries a sparkline of held-out
 * accuracy, the figure's only chart. The pool renders as a single easy→hard
 * strip with a marker at the solve frontier (the difficulty where solving is
 * a coin flip — per-problem threshold noise scatters squares around it).
 * Squares gained this pass are outlined, so the plateau arrives visibly as
 * the highlights dry up, before the sparkline says so.
 * The mechanism is illustrative and seeded, not a digitized curve: 60 problems with
 * fixed per-problem solvability thresholds, so the solved set grows exactly
 * when skill grows and every run is reproducible. Three behaviours to feel:
 * the ratchet (each round's better model writes correct rationales for harder
 * problems), the plateau (problems the model can never solve unaided never
 * enter the set — the strip's dwindling new-this-pass highlights make the
 * stall visible, not asserted), and rationalization lifting the plateau. The filter toggle is the page's flag for Act 3: switch
 * the answer key off and the loop trains on its own mistakes until accuracy
 * sinks toward chance.
 *
 * Section 2 is the loop written down: the paper's Algorithm 1 compressed to
 * ten annotated pseudocode lines, directly under the interactive so the
 * reader parses the mechanism they just ran. A plain-language walkthrough
 * sits above the listing for readers who don't parse pseudocode; the
 * annotation column carries the RL mapping.
 *
 * Section 3 is the paper's Table 1 (data/star-cqa.json), quoted verbatim: 6B
 * GPT-J plus its own filtered rationales lands at 72.5% on CommonsenseQA —
 * past a 23x larger LaMDA doing few-shot CoT, beside a 30x larger GPT-3
 * fine-tuned on the full human-labelled training set.
 *
 * The page closes with exactly two blocks, deliberately kept at the bottom so
 * they read over both the listing and the results:
 * the page's one counterweight (trained on reasoning, graded on answers; the
 * paper's own stated limitation, and the only place the page admits the loop
 * can be wrong — do not trim it as the page tightens), and the o1/R1 hand-off
 * to page 13 ("this shape", not "this loop": R1's reward is documented, o1's
 * never was — page 13 owns o1's specifics).
 *
 * Outside citations (in the listing's annotation column and the counterweight)
 * so the page's structural claims no longer rest on STaR describing itself:
 * ExIt (Anthony et al. 2017) grounds the "this is RL" mapping on line 2, whose
 * exit condition ("until accuracy plateaus") points back at section 1's
 * plateau; RFT (Yuan et al. 2023) names the sample-k alternative on line 5,
 * whose annotation states the correction that must hold — STaR decodes
 * greedily, one attempt per problem (the paper reports higher temperatures
 * reach more right answers through wrong reasoning), so improvement is
 * generalization, not distilled luck: each round's fine-tuned model is a
 * different model whose greedy output reaches harder problems, the ratchet
 * stated in section 1's caption; and GVM (Yao et al. 2025) gives the
 * counterweight outside evidence that models write wrong reasoning yet land
 * right answers. STaR and RFT are a closely related family, never
 * "synonymous" — GVM separates them on exactly the greedy-vs-sampling axis.
 * The V-STaR/ReST^EM lineage is deliberately omitted — intuition over history.
 *
 * Sidenote convention as on page 2: a state-matrix note beside the interactive,
 * numbered References notes (Cite/RefItem) beside the steps that use them,
 * provenance footnote at the bottom.
 */

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
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
const REF = { star: 1, exit: 2, rft: 3, gvm: 4 } as const;

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
  {
    indent: 0,
    code: "loop: until accuracy plateaus",
    note: (
      <>
        expert iteration (Anthony et al. 2017) — the same loop, before LLMs
        <Cite n={REF.exit} />
      </>
    ),
  },
  { indent: 1, code: "kept ← ∅" },
  {
    indent: 1,
    code: "for (x, y) in problems:",
    note: "the only supervision that exists: answers, never reasoning",
  },
  {
    indent: 2,
    code: "r, ŷ ← M(x)",
    note: (
      <>
        one greedy rollout — low variance, biased exploration; RFT (Yuan et al. 2023) samples k
        instead
        <Cite n={REF.rft} />
      </>
    ),
  },
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

/**
 * A sparkline of held-out accuracy, one point per iteration, drawn inside the
 * Test panel — the figure's only chart. The dashed baseline is chance.
 */
function Spark({ history }: { history: StarIteration[] }) {
  const W = 176;
  const H = 44;
  const x = (i: number) => 2 + (i / STAR_MAX_ITERS) * (W - 4);
  const y = (acc: number) => H - 2 - (acc / 100) * (H - 4);
  const last = history[history.length - 1];
  const d = history
    .map((s, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(s.accuracy).toFixed(1)}`)
    .join(" ");
  return (
    <div className="flex flex-col gap-0.5">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Held-out accuracy across ${history.length - 1} iterations, from ${history[0].accuracy.toFixed(1)}% to ${last.accuracy.toFixed(1)}%. Guessing is ${CHANCE}%.`}
      >
        <line
          x1={2}
          x2={W - 2}
          y1={y(CHANCE)}
          y2={y(CHANCE)}
          stroke="currentColor"
          strokeDasharray="3 3"
          className="text-grid"
        />
        <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-ink" />
        <circle
          cx={x(history.length - 1)}
          cy={y(last.accuracy)}
          r={2.5}
          fill="currentColor"
          className="text-ink"
        />
      </svg>
      <p className="text-[10px] uppercase tracking-wide text-ink-muted">
        per iteration · dashed = guessing ({CHANCE}%)
      </p>
    </div>
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
  const prevStatus = iter > 0 ? history[iter - 1].status : null;
  const isNew = now.status.map(
    (s, i) => prevStatus !== null && s !== "unsolved" && prevStatus[i] === "unsolved",
  );
  const newCount = isNew.filter(Boolean).length;
  // The difficulty at which solving is a coin flip, as a position on the strip.
  const frontierPct = Math.min(1, Math.max(0, now.skill)) * 100;

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
              Each press runs one training round, then tests on held-out problems the loop never
              touches.
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

            {/* readouts — the two regimes, kept apart and labelled */}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
              <div className="flex min-w-0 flex-col gap-2 rounded border border-dashed border-grid p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Training · what this round produced
                </p>
                <div className="flex justify-between font-mono text-[10px] uppercase tracking-wide text-ink-muted" aria-hidden="true">
                  <span>easy</span>
                  <span>hard</span>
                </div>
                <div className="relative">
                  <div
                    className="flex h-5 w-full gap-px"
                    role="img"
                    aria-label={`The training pool after iteration ${iter}, one strip of ${STAR_POOL} problems from easy to hard: ${now.verified} contributed a verified rationale, ${now.rationalized} a rationale written backwards from the given answer, ${now.wrong} a wrong rationale kept because the filter is off, and ${STAR_POOL - trainSize} contributed nothing. ${newCount} are new this pass. The solve frontier, where solving is a coin flip, sits ${Math.round(frontierPct)}% of the way along.`}
                  >
                    {now.status.map((s, i) => (
                      <span
                        key={i}
                        className={`min-w-0 flex-1 rounded-[1px] ${STATUS_TONE[s]} ${
                          isNew[i] ? "ring-1 ring-ink" : ""
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    className="pointer-events-none absolute -bottom-1 -top-1 w-[2px] -translate-x-1/2 rounded bg-ink"
                    style={{ left: `${frontierPct}%` }}
                    aria-hidden="true"
                  />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                  {now.verified > 0 ? (
                    <Key className="bg-correct" label={`verified rationale (${now.verified})`} />
                  ) : null}
                  {now.rationalized > 0 ? (
                    <Key className="bg-compute" label={`rationalized from a hint (${now.rationalized})`} />
                  ) : null}
                  {now.wrong > 0 ? (
                    <Key className="bg-wrong" label={`wrong, but kept (${now.wrong})`} />
                  ) : null}
                  {STAR_POOL - trainSize > 0 ? (
                    <Key className="bg-grid" label={`not in the set (${STAR_POOL - trainSize})`} />
                  ) : null}
                  {newCount > 0 ? (
                    <Key className="bg-correct ring-1 ring-ink" label={`new this pass (${newCount})`} />
                  ) : null}
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-0.5 rounded bg-ink" aria-hidden="true" />
                    solve frontier (50/50 odds)
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  fine-tuned on {trainSize} rationales — a slightly better model writes correct
                  rationales for slightly <em>harder</em> problems: a training set it could not
                  have written last time.
                </p>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded border border-dashed border-grid p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Test · how good did it get?
                </p>
                <BigNumber
                  value={now.accuracy}
                  suffix="%"
                  tone={now.wrong > 0 ? "wrong" : "correct"}
                  label={`on held-out problems, after iteration ${iter}`}
                />
                <Spark history={history} />
              </div>
            </div>

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              The correct answer is the external signal deciding what the model may study.
            </p>

            <p className="text-xs text-ink-muted">
              <strong className="text-ink">Calibration.</strong> The anchors this mechanism
              reproduces: it starts near 35% (GPT-J few-shot CoT: 36.6%), plateaus near 68%
              without rationalization (STaR&apos;s 68.8%), bottoms out at the 20% floor of
              five-way multiple choice, and its plateau training set covers 60% of the pool
              (the paper generates rationales for 69.7% of its training set).
              <Cite n={REF.star} /> Rationalization&apos;s caveat: it helped substantially on
              CommonsenseQA and dramatically on arithmetic, but did not substantially improve
              GSM8K. One simplification: the paper seeds generation with a few-shot
              prompt of example rationales; here that seed is simply the model&apos;s starting
              skill.
            </p>
          </div>
        </section>

        <Note kicker="What you're watching">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-ink">filter on · rationalization off</p>
            <p>
              The bare loop: sample, keep what checks out, imitate. The frontier advances, then
              stalls.
            </p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-ink">filter on · rationalization on</p>
            <p>Full STaR — reach past the frontier with the answer in hand. The plateau lifts.</p>
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-semibold text-ink">filter off</p>
            <p>No reward, no loop. The frontier rots and accuracy walks off the cliff.</p>
          </div>
        </Note>

        {/* Section 2 — the algorithm, written down and read twice */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. The loop, written down</h2>

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

          <p className="text-sm text-ink">
            The same loop, compressed to ten lines. Read it once as an algorithm. Then read it
            again — the annotations on lines 2 and 6 name what it secretly is.
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
        </section>

        <Note kicker="References">
          <RefItem n={REF.star} href="https://arxiv.org/abs/2203.14465">
            Zelikman et al. 2022, <em>STaR: Bootstrapping Reasoning With Reasoning</em>, NeurIPS
            2022.
          </RefItem>
          <RefItem n={REF.exit} href="https://arxiv.org/abs/1705.08439">
            Anthony, Tian &amp; Barber 2017, <em>Thinking Fast and Slow with Deep Learning and
            Tree Search</em>, NeurIPS 2017.
          </RefItem>
          <RefItem n={REF.rft} href="https://arxiv.org/abs/2308.01825" preprint>
            Yuan et al. 2023, <em>Scaling Relationship on Learning Mathematical Reasoning with
            Large Language Models</em>.
          </RefItem>
          <RefItem n={REF.gvm} href="https://arxiv.org/abs/2505.02391" preprint>
            Yao et al. 2025, <em>Optimizing Chain-of-Thought Reasoners via Gradient Variance
            Minimization in Rejection Sampling and RL</em>.
          </RefItem>
        </Note>

        {/* Section 3 — the paper's result */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What the loop bought
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

        {/* The two closing blocks — kept at the page bottom on purpose, reading
            over both the listing and the results above them. */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <p className="rounded border-l-4 border-wrong bg-surface p-4 text-base text-ink">
            <strong className="text-ink">Trained on reasoning, graded on answers.</strong> The
            rationale is what enters the weights; the answer key is all that decides whether it
            gets there. A flawed argument that lands correctly isn&apos;t merely kept — it&apos;s
            imitated.
            <Cite n={REF.star} /> Not a hypothetical: models often write a wrong reasoning path
            and still land on the right answer — hint or no hint.
            <Cite n={REF.gvm} /> Page 9&apos;s outcome-versus-process trade, now deciding what
            the model becomes.
          </p>

          <p className="rounded border-l-4 border-compute bg-surface p-4 text-base text-ink">
            o1 and R1 keep exactly this shape — sample reasoning, score it, reinforce what
            scored — and drop the disguise: the filter becomes an explicit RL reward on checkable
            tasks, and the model&apos;s own sampling becomes the training set.{" "}
            <em>Page 13 picks it up from there.</em>
          </p>
        </div>
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
