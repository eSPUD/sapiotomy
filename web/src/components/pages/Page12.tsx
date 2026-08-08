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
 * press runs one training round, then a held-out test, and appends one point
 * to the section's centerpiece: a chart of the run's whole history in the
 * deck's shared grammar (ChartFrame, as on pages 11 and 13) — held-out
 * accuracy (ink; the test) against the share of the pool whose rationale
 * entered the training set (compute; the ratchet), guessing as the dashed
 * floor. The old easy→hard pool strip (status squares, legend, solve-frontier
 * marker) was reviewed out: the page's three lessons are trends, and the
 * strip could only show one instant — the ratchet is now the climb, the
 * plateau the flattening, and with the filter off the curves split: a third
 * curve (wrong) counts the mistakes kept while accuracy dives to the floor.
 * The difficulty-frontier mechanism lives in the caption ("a slightly better
 * model writes correct rationales for slightly harder problems"), not in a
 * marker. The Test panel keeps the big number as per-press feedback.
 * The mechanism is illustrative and seeded, not a digitized curve: 60 problems with
 * fixed per-problem solvability thresholds, so the solved set grows exactly
 * when skill grows and every run is reproducible. Three behaviours to feel:
 * the ratchet, the plateau, and rationalization lifting the plateau. The filter toggle is the page's flag for Act 3: switch
 * the answer key off and the loop trains on its own mistakes until accuracy
 * sinks toward chance.
 *
 * Section 2 is the loop written down: the paper's Algorithm 1 compressed to
 * ten annotated pseudocode lines, directly under the interactive so the
 * reader parses the mechanism they just ran. A plain-language walkthrough
 * sits below the listing as the safety net for readers who bounced off the
 * pseudocode; the annotation column carries the RL mapping.
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
 * never was — page 13 owns o1's specifics). The hand-off carries page 11's
 * lift-vs-slide idiom (STaR = the first knob that lifts the curve without
 * buying parameters), so page 13's "training lifts, thinking slides" law
 * reads as the third beat of one pattern, not a callback that skipped a page.
 * It opens one altitude higher than the page, by review request: this is the
 * last page of Act 2, so the block first sums the act's two ways to buy
 * reasoning (spend after the question lands, pages 5-11; spend long before it
 * exists, this page) and closes on Act 3 turning both at once and billing for
 * each. Page 13's lede is written to receive exactly that pair — its two
 * compute axes ARE these two threads — so the seam is stated on both sides.
 *
 * Outside citations, so the page's structural claims no longer rest on STaR
 * describing itself. Per the page 2/3 convention, Cite superscripts live in
 * prose only — the listing's annotations name ExIt and RFT but carry no
 * markers; the numbered cites sit in the figcaption below the listing — and
 * each References note sits beside its ref's first use (STaR beside the
 * interactive, ExIt + RFT beside the listing, GVM beside the closing blocks):
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
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
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
import { STAR_LINES } from "@/lib/starListing";
import { useStore } from "@/store/useStore";

const PAGE_N = 12;
const POOL = starInit();
const CHANCE = 100 / STAR_CHOICES;

/** Page 12's references, numbered in order of first appearance. */
const REF = { star: 1, exit: 2, rft: 3, gvm: 4 } as const;

/**
 * Section 2's listing — STaR's Algorithm 1 compressed to ten lines. The code
 * column is shared with page 13 (lib/starListing), which diffs the frontier
 * rewrite against these exact lines; only the annotations are this page's.
 * The listing carries no tone borders — the annotations alone do the tying to
 * section 1 — and structural lines carry no annotation.
 */
const CODE_NOTES: Record<number, { note?: React.ReactNode }> = {
  0: { note: "one model is both student and teacher" },
  1: { note: "expert iteration (Anthony et al. 2017) — the same loop, before LLMs" },
  3: { note: "the only supervision that exists: answers, never reasoning" },
  4: {
    note: "one greedy rollout — low variance, biased exploration; RFT (Yuan et al. 2023) samples k instead",
  },
  5: {
    note: "in RL terms: a binary reward, checked for free by section 1's answer key",
  },
  7: {
    note: "hindsight: knowing the destination makes the route easier to find",
  },
  8: {
    note: "the hint is stripped, so the model trains as if it had found the route unaided",
  },
  9: {
    note: "restart from the base model every round, so early quirks never compound into the weights",
  },
};

const CODE_LINES: {
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
}[] = STAR_LINES.map((line, i) => ({ ...line, ...CODE_NOTES[i] }));

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/*
 * Round an SVG coordinate to 2 decimals: float outputs can differ in the last
 * bits between server and client render, which React reports as a hydration
 * mismatch; rounding makes both sides emit the same string.
 */
const px = (v: number) => Math.round(v * 100) / 100;

/**
 * Section 1's centerpiece, replacing the old pool strip: the run's whole
 * history as curves, one point appended per press. Held-out accuracy (ink) is
 * the test; the share of the pool whose rationale entered the training set
 * (compute) is the ratchet; with the filter off a third curve (wrong) counts
 * the mistakes kept, and the lesson is the split — the set fills while
 * accuracy dives to the dashed guessing floor. Every curve carries its own
 * end label, so identity is never colour alone.
 */
function StarChart({ history }: { history: StarIteration[] }) {
  const width = 640;
  const height = 260;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = (i: number) => px((i / STAR_MAX_ITERS) * innerW);
  const y = (v: number) => px(innerH - (v / 100) * innerH);
  const share = (n: number) => (n / STAR_POOL) * 100;
  const last = history.length - 1;
  const now = history[last];
  const setShare = share(now.verified + now.rationalized + now.wrong);
  const series = [
    {
      key: "acc",
      label: "held-out accuracy",
      stroke: "stroke-ink",
      fill: "fill-ink",
      vals: history.map((s) => s.accuracy),
    },
    {
      key: "set",
      label: "in the training set",
      stroke: "stroke-compute",
      fill: "fill-compute",
      vals: history.map((s) => share(s.verified + s.rationalized + s.wrong)),
    },
  ];
  const wrongVals = history.map((s) => share(s.wrong));
  if (wrongVals.some((w) => w > 0)) {
    series.push({
      key: "wrong",
      label: "wrong, but kept",
      stroke: "stroke-wrong",
      fill: "fill-wrong",
      vals: wrongVals,
    });
  }
  const path = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join("");
  /* Flip the end labels to the left of the marker once the run nears the
     right edge, so they never overflow the frame. */
  const labelLeft = last > STAR_MAX_ITERS / 2;
  const title = `Held-out accuracy and training-set share across ${last} iteration${
    last === 1 ? "" : "s"
  }, one point per iteration. Accuracy: ${now.accuracy.toFixed(1)}% on held-out problems. Training set: ${setShare.toFixed(0)}% of the ${STAR_POOL}-problem pool${
    now.wrong > 0
      ? `, of which ${share(now.wrong).toFixed(0)} points are wrong rationales kept because the filter is off`
      : ""
  }. The dashed baseline marks guessing at ${CHANCE}%.`;
  return (
    <ChartFrame title={title} width={width} height={height} xLabel="iteration" yLabel="percent">
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10, 12].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      {/* the guessing floor */}
      <line
        x1={0}
        x2={innerW}
        y1={y(CHANCE)}
        y2={y(CHANCE)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW - 4} y={y(CHANCE) + 12} textAnchor="end" className="fill-ink-muted text-[10px]">
        guessing {CHANCE}%
      </text>

      {series.map((c) => (
        <g key={c.key}>
          <path d={path(c.vals)} fill="none" className={c.stroke} strokeWidth={2} />
          {c.vals.map((v, i) => (
            <circle key={i} cx={x(i)} cy={y(v)} r={i === last ? 3.5 : 2} className={c.fill} />
          ))}
          <text
            x={labelLeft ? x(last) - 8 : x(last) + 8}
            y={y(c.vals[last]) - 8}
            textAnchor={labelLeft ? "end" : "start"}
            className={`${c.fill} text-[10px] font-semibold`}
          >
            {c.label}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

/** A rounded node box with one or two centred text lines. */
function LoopBox({
  x,
  y,
  w,
  h,
  cls = "fill-surface-raised stroke-grid",
  strokeWidth = 1,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  cls?: string;
  strokeWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className={cls} strokeWidth={strokeWidth} />
      {children}
    </g>
  );
}

/** "Rationale, Answer" with the paper's colour coding (rationale red, answer blue). */
function RAText({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[13px] font-semibold">
      <tspan className="fill-wrong">Rationale</tspan>
      <tspan className="fill-ink-muted">, </tspan>
      <tspan className="fill-compute">Answer</tspan>
    </text>
  );
}

/**
 * Section 1's loop graph — STaR's Figure 1 (Zelikman et al. 2022) redrawn in the
 * deck's grammar and animated to show the loop turning: the fine-tune outer loop
 * (dashed, exactly as the paper draws it) marches forward, and a comet segment
 * travels the whole cycle. Both are pure CSS animations, so the global
 * prefers-reduced-motion rule stops them. It is a static illustration — the
 * controls below drive the chart, not this diagram.
 *
 * The comet rides `LOOP_D`, a single continuous path over the happy loop (model →
 * generate → correct → training set → fine-tune → model); pathLength=100 lets the
 * dash values read as percentages of its length regardless of the real geometry.
 */
const LOOP_D =
  "M410 178 H600 V92 H151 V72 C 232 108 268 128 316 150 L410 178 Z";

function StarLoop() {
  return (
    <svg
      viewBox="0 0 680 360"
      role="img"
      aria-label="STaR's loop, after Zelikman et al. 2022, Figure 1. A dataset of questions with known answers fine-tunes the language model. For each question the model generates a rationale and an answer. If the answer is correct, the question, rationale and answer join the training set. If it is wrong, the correct answer is handed back as a hint and the model rationalizes; a rationalization that now checks out also joins the set, with the hint stripped. The enlarged set fine-tunes the base model, and the loop repeats."
      className="mx-auto w-full max-w-[680px]"
    >
      <defs>
        <marker id="star-head" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-ink-muted" />
        </marker>
      </defs>

      {/* ---- edges (drawn first, so node boxes sit on top) ---- */}
      <g fill="none" strokeWidth={1.8} className="stroke-ink-muted" markerEnd="url(#star-head)">
        <path d="M162 181 H296" />
        <path d="M410 178 H472" />
        {/* correct → training set, over the top */}
        <path d="M600 150 V92 H151 V74" />
        {/* wrong → hint */}
        <path d="M566 198 C 612 222 606 248 560 264" />
        {/* hint → model (retry) */}
        <path d="M484 286 C 430 282 388 250 360 214" />
        {/* model → rationalized rationale */}
        <path d="M346 214 C 326 258 372 286 418 290" />
        {/* rationalized correct → training set, up the left */}
        <path d="M250 290 H26 V52 H42" />
      </g>

      {/* fine-tune outer loop: dashed and flowing */}
      <path
        d="M186 72 C 232 108 268 128 314 150"
        fill="none"
        strokeWidth={1.8}
        strokeDasharray="6 6"
        markerEnd="url(#star-head)"
        className="stroke-ink-muted animate-star-flow"
      />

      {/* the comet: a short bright segment travelling the whole cycle */}
      <path
        d={LOOP_D}
        pathLength={100}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="4 96"
        className="stroke-compute animate-star-comet"
      />

      {/* ---- edge labels & verdict marks ---- */}
      <text x={441} y={168} textAnchor="middle" className="fill-ink-muted text-[11px]">generate</text>
      <text x={372} y={258} textAnchor="middle" className="fill-ink-muted text-[11px]">rationalize</text>
      <text x={250} y={118} textAnchor="middle" className="fill-ink-muted text-[11px]">fine-tune</text>
      <text x={626} y={112} textAnchor="middle" className="fill-correct text-[15px] font-bold">✓</text>
      <text x={626} y={130} textAnchor="middle" className="fill-ink-muted text-[10px]">correct</text>
      <text x={626} y={232} textAnchor="middle" className="fill-wrong text-[15px] font-bold">✗</text>
      <text x={626} y={250} textAnchor="middle" className="fill-ink-muted text-[10px]">wrong</text>
      <text x={232} y={294} textAnchor="middle" className="fill-correct text-[15px] font-bold">✓</text>

      {/* ---- nodes ---- */}
      <LoopBox x={44} y={24} w={214} h={48}>
        <text x={151} y={49} textAnchor="middle" dominantBaseline="middle" className="text-[13px] font-semibold">
          <tspan className="fill-compute">Question</tspan>
          <tspan className="fill-ink-muted">, </tspan>
          <tspan className="fill-wrong">Rationale</tspan>
          <tspan className="fill-ink-muted">, </tspan>
          <tspan className="fill-compute">Answer</tspan>
        </text>
      </LoopBox>

      <LoopBox x={44} y={158} w={118} h={44}>
        <text x={103} y={181} textAnchor="middle" dominantBaseline="middle" className="fill-compute text-[13px] font-semibold">
          Question
        </text>
      </LoopBox>

      <LoopBox x={298} y={150} w={112} h={64} cls="fill-surface stroke-ink" strokeWidth={1.5}>
        <text x={354} y={175} textAnchor="middle" dominantBaseline="middle" className="fill-ink text-[13px] font-semibold">
          Language
        </text>
        <text x={354} y={192} textAnchor="middle" dominantBaseline="middle" className="fill-ink text-[13px] font-semibold">
          Model
        </text>
      </LoopBox>

      <LoopBox x={474} y={150} w={170} h={48} cls="fill-correct/10 stroke-correct/60">
        <RAText x={559} y={175} />
      </LoopBox>

      <LoopBox x={484} y={266} w={118} h={46} cls="fill-surface-raised stroke-ink-muted">
        <text x={543} y={290} textAnchor="middle" dominantBaseline="middle" className="fill-ink text-[13px] font-semibold">
          Hint
        </text>
      </LoopBox>

      <LoopBox x={250} y={266} w={170} h={48} cls="fill-correct/10 stroke-correct/60">
        <RAText x={335} y={291} />
      </LoopBox>
    </svg>
  );
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
}: {
  n: number;
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-0.5 sm:grid-cols-[auto_minmax(0,20rem)_minmax(0,1fr)] sm:gap-x-4">
      <span className="w-5 select-none text-right font-code text-xs tabular-nums text-ink-muted" aria-hidden="true">
        {n}
      </span>
      <span className="flex items-baseline font-code text-sm text-ink">
        {/* Tab-width indentation, each level marked by an editor-style arrow guide. */}
        {indent > 0 ? (
          <span className="flex select-none" aria-hidden="true">
            {Array.from({ length: indent }, (_, j) => (
              <span key={j} className="w-[3ch] text-grid">
                →
              </span>
            ))}
          </span>
        ) : null}
        <code className="whitespace-pre">{code}</code>
      </span>
      {note ? (
        <span className="col-start-2 text-xs text-ink-muted sm:col-start-3">{note}</span>
      ) : null}
    </div>
  );
}

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
            {/* the loop itself, drawn as STaR's Figure 1 and animated to turn */}
            <StarLoop />

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

            {/* readouts — the run's whole history as curves, the big number as per-press feedback */}
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-stretch">
              <div className="min-w-0">
                <StarChart history={history} />
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
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              fine-tuned on {trainSize} rationales — a slightly better model writes correct
              rationales for slightly <em>harder</em> problems: a training set it could not
              have written last time. The ink curve is graded on held-out problems; the compute
              curve counts the pool.
            </p>

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

        {/* Section 1's margin: the state matrix, then ref 1 beside its first use. */}
        <div className="flex flex-col gap-6 lg:gap-0">
          <Note kicker="What you're watching">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-ink">filter on · rationalization off</p>
              <p>The bare loop: write, keep what checks out, imitate. Both curves climb, then flatten.</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-ink">filter on · rationalization on</p>
              <p>Full STaR — reach past the stall with the answer in hand. The plateau lifts.</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-semibold text-ink">filter off</p>
              <p>
                No reward, no loop. The curves split: the set keeps filling while accuracy walks
                off the cliff.
              </p>
            </div>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.star} href="https://arxiv.org/abs/2203.14465">
              Zelikman et al. 2022, <em>STaR: Bootstrapping Reasoning With Reasoning</em>, NeurIPS
              2022.
            </RefItem>
          </Note>
        </div>

        {/* Section 2 — the algorithm, written down and read twice */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. The loop, written down</h2>

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
                <CodeLine key={i} n={i + 1} indent={l.indent} code={l.code} note={l.note} />
              ))}
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              STaR&apos;s Algorithm 1, compressed.
              <Cite n={REF.star} /> Line 2&apos;s lineage is real, not an analogy: the same loop
              ran as expert iteration in RL, five years before LLM reasoning.
              <Cite n={REF.exit} /> Line 5&apos;s sample-k alternative is RFT.
              <Cite n={REF.rft} />
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
        </section>

        <Note kicker="References">
          <RefItem n={REF.exit} href="https://arxiv.org/abs/1705.08439">
            Anthony, Tian &amp; Barber 2017, <em>Thinking Fast and Slow with Deep Learning and
            Tree Search</em>, NeurIPS 2017.
          </RefItem>
          <RefItem n={REF.rft} href="https://arxiv.org/abs/2308.01825" preprint>
            Yuan et al. 2023, <em>Scaling Relationship on Learning Mathematical Reasoning with
            Large Language Models</em>.
          </RefItem>
        </Note>

        {/* Section 3 — the paper's result */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What the loop bought
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Zelikman et al. 2022 · CommonsenseQA
              <Cite n={REF.star} />
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
            <strong className="text-ink">There are now two ways to buy reasoning.</strong> All of
            Act 2 spends the compute after the question lands: show the road, cap the tokens,
            sample and vote, score and re-rank, search the tree, and page 11 priced that whole
            shelf against parameters. This page is the other way, and it spends long before the
            question exists: in page 11&apos;s terms, the first knob that lifts the curve without
            buying a single parameter. o1 and R1 keep this loop&apos;s shape and drop the disguise:
            the filter becomes an explicit RL reward on checkable tasks, and the model&apos;s own
            sampling becomes the training set. Next comes the frontier, where one lab turns both
            kinds of spending at once and bills you for each.{" "}
            <em>Page 13 picks it up from there.</em>
          </p>
        </div>

        <Note kicker="References">
          <RefItem n={REF.gvm} href="https://arxiv.org/abs/2505.02391" preprint>
            Yao et al. 2025, <em>Optimizing Chain-of-Thought Reasoners via Gradient Variance
            Minimization in Rejection Sampling and RL</em>.
          </RefItem>
        </Note>
      </div>

      
      <div className="flex flex-col gap-1 text-xs text-ink-muted">
        <p>
          <strong className="text-ink">Simulated</strong> — the loop in section 1 is a seeded
          mechanism, not digitized data. No published result fixes what &ldquo;60 problems&rdquo;
          or the hint boost mean numerically. It reproduces the shapes: bootstrapping to a plateau,
          rationalization lifting it, degeneration without the filter.
        </p>
        <p>
          <strong className="text-ink">Cited</strong> — every figure in section 3 is from Zelikman
          et al. 2022, Table 1, CommonsenseQA dev.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
