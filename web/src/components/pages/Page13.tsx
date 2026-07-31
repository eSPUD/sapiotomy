"use client";

/**
 * Page 13, "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve".
 * Page 12 closed on a promise — o1 keeps the loop's shape and drops the
 * disguise — and this page holds it to that promise with abstractions, not
 * announcement transcription. The reader should leave with three things the
 * literature never states in one place: the loop-diff (section 1), the
 * unified two-knob law (section 2), and the visibility boundary (section 4).
 *
 * The lede is the Act 2 → Act 3 seam, and is written against page 12's closing
 * block: that block sums the act as two ways to buy reasoning (spend after the
 * question lands, pages 5-11; spend long before it exists, page 12), and this
 * lede names the same pair before saying o1 turns both dials at once. It must
 * not claim "everything so far bolted reasoning on from outside" — page 12
 * already trained it in, and that phrasing made the seam read as a skipped
 * page. The two compute axes in section 2 are these two threads, so the law
 * lands as the reader's own question answered, not a new frame.
 *
 * Section 1 opens with the loop strip in page 12's stage grammar — the same
 * three stations, two renamed (filter → reward, fine-tune → reinforce) — so
 * the "same shape, disguise dropped" claim lands visually before any code is
 * read; the strip states the shape, the listing states the diff. Below it,
 * the rumored o1 recipe as a six-line listing — page 12's loop
 * rewritten, with the annotation column carrying the mapping back to page
 * 12's lines (filter → explicit reward, one greedy rollout → k sampled
 * chains, plateau exit → compute budget, finetune-from-base →
 * reinforce-in-place, hint branch deleted because sampling explores). The
 * full STaR listing is deliberately NOT re-printed (review: the reader just
 * ran it twice on page 12; showing only the rewrite reads cleaner), and
 * there is no toggle — the listing is static, page 1-3 digestibility.
 * The listing shares page 12's code conventions — font-code (true
 * monospace), tab-arrow indentation guides, no tone borders — so the two
 * listings read as one grammar; the annotations alone carry the diff.
 * Honesty is load-bearing: OpenAI confirmed the FRAME — large-scale RL on a
 * long private chain, and its researchers' own LRM definition — but never
 * published the algorithm, so the rewrite is labelled rumor in the h2 badge
 * and the caption. The callout under the listing carries the page's two
 * build-ons: no human anywhere in the loop (vs RLHF), and no draw on page
 * 3's finite stock of human text.
 *
 * Section 2 keeps the two-knob lab, redrawn in page 11's chart grammar after
 * review: the old half-width two-curve LineChart hid the law — the training
 * knob's effect existed only between frames, and the default state (full RL)
 * showed a single line and a +0.0 delta. Now the whole family of RL runs
 * (×1, ×10, ×100 — the same authored line, slid one decade right per decade
 * of RL forgone, clamped at the floor) is drawn at once at full card width,
 * page 11's FamilyChart idiom: the training dial picks your curve, the
 * thinking dial slides your marker along it, and a bracket at the marker
 * prices the missing RL. The staircase arrows state the law statically — up
 * one curve and along one decade buy the same +29.5 — so "one law, two
 * knobs" is legible before anything is dragged; the default (×10, ×10) opens
 * with the bracket showing exactly one decade forgone. The Try-it note is a
 * single imperative sentence, page 2's margin grammar — the interpretation
 * (thinking walks your curve and never climbs to the next one; the equality
 * law(2,0) = law(0,2)) lives in the card's closing line, where the deck puts
 * meaning. The fidelity note is compressed to two sentences; "the slope is
 * the claim; the absolute compute is a secret" survives on purpose — it is
 * itself an abstraction (labs publish shapes, not units).
 *
 * Section 3 is one question asked twice — "Stack the toolbox, or turn the
 * knobs?" The waterfall is the stacking answer (Act 2's tricks as a second
 * storey on the learned chain; rows are mechanisms, model names demoted to
 * parentheses). The knob answer is El-Kishky's own ablation, compressed to
 * one paragraph in the deck's vocabulary — o1-ioi is the toolbox bolted on
 * by hand at the frontier, an early o3 is the knobs turned further, and the
 * knobs won — with the paper's conclusion as the one verbatim anchor. No
 * benchmark numbers anywhere: the medals, percentiles, and the AIME pair
 * were reviewed out as retelling; scores live on page 15 (The Scoreboard).
 * o3-preview.json is no longer read here (its reference dropped off the
 * page).
 *
 * Section 4 replaces the old boundary diagram (three visual systems, no
 * shared grammar) with a ledger — what exists / who can read it / who pays —
 * so the asymmetry is a column the eye can scan. Every ledger cell carries
 * words (review: an em-dash cell reads as a rendering bug). The three
 * closing blocks (the case for hiding, the price, the R1 handoff) are kept
 * verbatim and in place by review request.
 *
 * No Simulated/Cited footer (review): pages 1-3 carry none either —
 * provenance is declared inline, in the h2 badges, section 1's caption, and
 * section 2's fidelity note.
 *
 * Anchored to data/o1-scaling.json; the law and the printed anchors are
 * pinned in frontier.test.ts, the page's structure in Page13.test.tsx.
 */

import { useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { BigNumber } from "@/components/BigNumber";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { twoAxisAccuracy } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 13;

/** Page 13's references, numbered in order of first appearance. */
const REF = { announce: 1, competitive: 2, systemCard: 3 } as const;

const SCALING = curves.o1Scaling;
const P = SCALING.fit!.params;

/* The chart samples the law every tenth of a decade across the figure's span. */
const EXPS = Array.from({ length: 21 }, (_, i) => i / 10);

const law = (testExp: number, trainExp: number) =>
  twoAxisAccuracy(testExp, trainExp, P.intercept, P.slopePerDecade, P.maxExp, P.floor);

/* Where o1's reported pass@1 sits on the fully-trained line. */
const O1_DOT = { x: 10 ** ((P.o1Pass1 - P.intercept) / P.slopePerDecade), y: P.o1Pass1 };

/*
 * The family of RL runs, one per decade of train-time compute: the same
 * authored line, slid one decade right for each decade of RL forgone, clamped
 * at the floor. One hue per run, page 11's family style; every curve carries
 * its own end label, so identity is never colour alone.
 */
const TRAIN_STOPS = [0, 1, 2] as const;
const RUN_HUES: Record<number, { stroke: string; fill: string; label: string }> = {
  0: { stroke: "stroke-wrong", fill: "fill-wrong", label: "×1" },
  1: { stroke: "stroke-compute", fill: "fill-compute", label: "×10" },
  2: { stroke: "stroke-correct", fill: "fill-correct", label: "×100 RL" },
};

/*
 * Round an SVG coordinate to 2 decimals: log-scale outputs differ in the last
 * float bits between server and client render, which React reports as a
 * hydration mismatch; rounding makes both sides emit the same string.
 */
const px = (v: number) => Math.round(v * 100) / 100;

/* The staircase: from one point on the ×10 run, up one curve and along one
   decade buy the same +29.5 — equal rise, different knob. */
const STAIR_EXP = 0.5;
const STAIR_LO = law(STAIR_EXP, 1);
const STAIR_HI = law(STAIR_EXP, 2);

/** An arrow drawn as a line with a small triangular head at (x2, y2). */
function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = px((Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI);
  return (
    <g aria-hidden="true">
      <line x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink" strokeWidth={1.2} />
      <polygon
        points="0,0 -7,3 -7,-3"
        transform={`translate(${x2},${y2}) rotate(${angle})`}
        className="fill-ink"
      />
    </g>
  );
}

/**
 * The two-knob chart, page 11's family idiom: every RL run drawn in full at
 * card width, the training dial highlighting one, the thinking dial sliding
 * the marker along it. The bracket from the marker up to the ×100 run prices
 * the missing RL; the staircase arrows state the law without any dragging.
 */
function RunFamilyChart({
  trainExp,
  testExp,
  acc,
  gap,
}: {
  trainExp: number;
  testExp: number;
  acc: number;
  gap: number;
}) {
  const width = 640;
  const height = 300;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const xScale = scaleLog().domain([1, 100]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, 100]).range([innerH, 0]);
  const x = (v: number) => px(xScale(v));
  const y = (v: number) => px(yScale(v));

  const family = TRAIN_STOPS.map((t) => ({
    t,
    pts: EXPS.map((e) => ({ x: 10 ** e, y: law(e, t) })),
  }));
  const path = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("");

  const mx = x(10 ** testExp);
  const full = law(testExp, P.maxExp);
  /* Flip the bracket label to the left when the marker nears the right edge. */
  const bracketLeft = testExp > 1.5;

  /* The staircase's two arrows: a riser between the runs, then a tread along
     the top run, drawn just above it so neither overdraws a curve. The tread
     label is rotated to the arrow's own slope, keeping it out of the marker's
     lane. */
  const sx = x(10 ** STAIR_EXP);
  const riserY1 = y(STAIR_LO) - 4;
  const riserY2 = y(STAIR_HI) + 4;
  const treadY1 = y(STAIR_HI) - 14;
  const treadX2 = x(10 ** (STAIR_EXP + 1));
  const treadY2 = y(law(STAIR_EXP + 1, 2)) - 14;
  const treadAngle = px((Math.atan2(treadY2 - treadY1, treadX2 - sx) * 180) / Math.PI);
  const treadMidX = px((sx + treadX2) / 2);
  const treadMidY = px((treadY1 + treadY2) / 2) - 8;

  const title = `AIME 2024 accuracy against test-time compute, log x axis, redrawn in relative units. Three RL training runs are drawn in full as parallel lines: the times 100 run climbs from ${law(0, 2).toFixed(0)} to ${law(2, 2).toFixed(0)} percent across two decades; the times 10 run is the same line one decade right, ending at ${law(2, 1).toFixed(1)} percent; the times 1 run barely leaves the floor, ending at ${law(2, 0).toFixed(0)} percent. Staircase arrows on the times 10 run show that times 10 more RL and times 10 more thinking buy the same ${P.slopePerDecade} points. A dashed reference marks GPT-4o at ${P.gpt4oAime} percent; o1's published pass at 1 of ${P.o1Pass1} percent sits as a dot on the times 100 run. Your marker: the times ${Math.round(10 ** trainExp)} run at times ${Math.round(10 ** testExp)} thinking, scoring ${acc.toFixed(1)} percent${gap > 0 ? `, with ${gap.toFixed(1)} points forgone to the missing RL` : ""}.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="test-time compute (relative units, log scale)"
      yLabel="accuracy (%)"
    >
      {[0, 20, 40, 60, 80, 100].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[1, 10, 100].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          ×{t}
        </text>
      ))}

      {/* GPT-4o, the no-chain reference */}
      <line
        x1={0}
        x2={innerW}
        y1={y(P.gpt4oAime)}
        y2={y(P.gpt4oAime)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW - 4} y={y(P.gpt4oAime) + 12} textAnchor="end" className="fill-ink-muted text-[10px]">
        GPT-4o {P.gpt4oAime}%
      </text>

      {/* every run, drawn in full; only the selected one is emphasized */}
      {family.map((f) => {
        const selected = f.t === trainExp;
        const end = f.pts[f.pts.length - 1];
        const hue = RUN_HUES[f.t];
        return (
          <g key={f.t} opacity={selected ? 1 : 0.45}>
            <path d={path(f.pts)} fill="none" className={hue.stroke} strokeWidth={selected ? 2.75 : 1.25} />
            <text
              x={innerW - 4}
              y={y(end.y) - 6}
              textAnchor="end"
              className={`text-[10px] ${hue.fill} ${selected ? "font-semibold" : ""}`}
            >
              {hue.label}
            </text>
          </g>
        );
      })}

      {/* o1's published anchor, on the full run */}
      <circle cx={x(O1_DOT.x)} cy={y(O1_DOT.y)} r={4.5} className="fill-ink stroke-canvas" strokeWidth={1.5} />
      <text x={x(O1_DOT.x) - 8} y={y(O1_DOT.y) - 8} textAnchor="end" className="fill-ink text-[10px]">
        o1 pass@1 {P.o1Pass1}%
      </text>

      {/* your marker, and the bracket pricing the missing RL */}
      <line x1={mx} x2={mx} y1={0} y2={innerH} className="stroke-ink-muted" strokeWidth={1} strokeDasharray="3 3" />
      {gap > 0 ? (
        <g>
          <line x1={mx} x2={mx} y1={y(acc)} y2={y(full)} className="stroke-compute" strokeWidth={2} />
          <circle cx={mx} cy={y(full)} r={3.5} className="fill-canvas stroke-compute" strokeWidth={1.5} />
          <text
            x={bracketLeft ? mx - 8 : mx + 8}
            y={(y(acc) + y(full)) / 2}
            dy="0.32em"
            textAnchor={bracketLeft ? "end" : "start"}
            className="fill-compute text-[10px] font-semibold"
          >
            the missing RL: +{gap.toFixed(1)}
          </text>
        </g>
      ) : null}
      <circle
        cx={mx}
        cy={y(acc)}
        r={5.5}
        className={`${RUN_HUES[trainExp].fill} stroke-canvas`}
        strokeWidth={1.5}
      />

      {/* the staircase, drawn last so the marker's lane never cuts its labels:
          up one curve = along one decade = +29.5 */}
      <Arrow x1={sx} y1={riserY1} x2={sx} y2={riserY2} />
      <text
        x={sx - 6}
        y={(riserY1 + riserY2) / 2}
        dy="0.32em"
        textAnchor="end"
        className="fill-ink text-[10px]"
      >
        ×10 RL → +{P.slopePerDecade}
      </text>
      <Arrow x1={sx + 6} y1={treadY1} x2={treadX2} y2={treadY2} />
      <text
        x={treadMidX}
        y={treadMidY}
        textAnchor="middle"
        transform={`rotate(${treadAngle}, ${treadMidX}, ${treadMidY})`}
        paintOrder="stroke"
        strokeWidth={3}
        className="fill-ink stroke-surface text-[10px]"
      >
        ×10 thinking → +{P.slopePerDecade}
      </text>
    </ChartFrame>
  );
}

/**
 * Section 1's listing: the rumored o1 recipe, six lines. The annotation
 * column carries the mapping back to page 12's loop — which is deliberately
 * not re-printed; the reader just ran it twice. The rewrite is a
 * reconstruction, not a publication; the caption says so.
 */
const O1_LINES: {
  indent: number;
  code: React.ReactNode;
  note?: React.ReactNode;
}[] = [
  {
    indent: 0,
    code: (
      <>
        M ← M<sub>0</sub>
      </>
    ),
    note: "the same start as page 12: one pretrained model, its own teacher",
  },
  {
    indent: 0,
    code: "loop: while the compute budget lasts",
    note: "page 12 looped until accuracy plateaued — the exit is a budget now, section 2's training axis",
  },
  {
    indent: 1,
    code: "for (x, y) in problems:",
    note: "unchanged: questions with checkable answers are still the only supervision",
  },
  {
    indent: 2,
    code: "r₁…rₖ, ŷ₁…ŷₖ ← M(x)",
    note: "k sampled chains per problem, not one greedy try — sampling explores, so page 12's hint branch is gone",
  },
  {
    indent: 2,
    code: "rewardᵢ ← check(ŷᵢ, y)",
    note: "page 12's filter, promoted to an explicit reward — still the answer key, still graded for free",
  },
  {
    indent: 1,
    code: "M ← reinforce(M, rewards)",
    note: "update the current model, not the base — this round's gains compound into the next",
  },
];

/** One stage of the loop strip, page 12's grammar. */
function Stage({ tone, title, sub }: { tone: string; title: string; sub: string }) {
  return (
    <div className={`min-w-0 flex-1 rounded-lg border-l-4 bg-surface-raised p-2.5 ${tone}`}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted">{sub}</p>
    </div>
  );
}

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
 * the right — page 12's rendering, so the two listings read as one grammar.
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

export function Page13() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  /* Open mid-family: ×10 thinking on the ×10 run — the marker on the middle
     curve with the bracket showing exactly one forgone decade (+29.5). */
  const [testExp, setTestExp] = useState(1);
  const [trainExp, setTrainExp] = useState(1);

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
      pays: "no one extra — it arrives with the answer",
      paysWrong: false,
    },
    {
      what: "The monitor's verdict",
      detail: "a deception check that reads the raw chain",
      reads: "the lab only",
      pays: "the lab — its own audit, run inside",
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
        Act 2 left two ways to buy reasoning: spend once the question lands (pages 5 to 11: votes,
        judges, search) or spend long before it does (page 12: train the reasoning in).{" "}
        <strong className="text-ink">o1</strong> is the first commercial model to turn both dials
        at once, and it kept the recipe. Its signature is{" "}
        <strong className="text-ink">a curve with two compute axes</strong>: how much of the score
        did the training buy, and how much did the thinking?
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
            {/* page 12's loop strip, redrawn: same three stations, two renamed */}
            <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center" aria-hidden="true">
              <Stage tone="border-ink" title="generate ×k" sub="k sampled chains per problem" />
              <span className="shrink-0 self-center text-ink-muted">→</span>
              <Stage tone="border-correct" title="reward" sub="the filter, made explicit" />
              <span className="shrink-0 self-center text-ink-muted">→</span>
              <Stage tone="border-compute" title="reinforce" sub="in place — gains compound" />
              <span className="shrink-0 self-center text-ink-muted">↺</span>
            </div>

            <p className="text-sm text-ink-muted">
              Page 12&apos;s strip, redrawn: the same three stations, two renamed. So here it is
              at the only honest resolution: page 12&apos;s loop, rewritten as the recipe the labs
              describe.{" "}
              <strong className="text-ink">The annotations name what each line was before.</strong>
            </p>

            <figure
              className="m-0 flex flex-col gap-2"
              aria-label="The rumored o1 recipe as pseudocode: the loop runs while the compute budget lasts, k chains are sampled per problem, the answer-key filter becomes an explicit reward, and the current model is reinforced in place instead of fine-tuning the base model. Page 12's hint branch is gone."
            >
              <div className="flex flex-col">
                {O1_LINES.map((l, i) => (
                  <CodeLine key={i} n={i + 1} indent={l.indent} code={l.code} note={l.note} />
                ))}
              </div>
              <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
                Six lines against page 12&apos;s ten: four rewritten, the hint branch deleted.
                A reconstruction matched to page 12&apos;s expert-iteration lineage —{" "}
                <strong className="text-ink">rumor, not record</strong>: OpenAI confirmed the
                frame and kept the algorithm.
              </figcaption>
            </figure>

            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              Now read what is <strong>not</strong> there: a human. RLHF pays people to judge
              outputs; here nobody writes an example and nobody grades one — the model authors
              the reasoning, the answer key scores it. And the training set never touches page
              3&apos;s finite stock of human text: the model writes its own curriculum.
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
            <p className="text-sm text-ink-muted">
              All three runs are drawn below: the same line, slid one decade right for every
              decade of RL forgone.{" "}
              <strong className="text-ink">The training dial picks your curve; the thinking dial
              slides your marker along it</strong> — and the bracket at your marker prices what
              the missing RL would have bought.
            </p>

            {/* the centerpiece at full card width, dials in a strip beneath */}
            <RunFamilyChart trainExp={trainExp} testExp={testExp} acc={acc} gap={gap} />
            <p className="text-xs text-ink-muted">
              all three RL runs are drawn in full and the dials never move them; only the
              highlight and your marker respond. The staircase says it without dragging: up one
              curve and along one decade buy the same +{P.slopePerDecade}.
            </p>

            <div className="flex flex-col gap-4 border-t border-dashed border-grid pt-3">
              {/* the two dials share one row, so they always sit at the same height */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Slider
                  label="RL training (train-time compute)"
                  min={0}
                  max={2}
                  step={1}
                  value={trainExp}
                  format={(v) => `×${Math.round(10 ** v)}`}
                  onChange={(v) => {
                    setTrainExp(v);
                    recordInteraction(PAGE_N);
                  }}
                />
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
              </div>
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
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">Thinking slides you along the curve; only training
              lifts it.</strong>{" "}
              The two dials pay the same +{P.slopePerDecade} per decade, but they do not
              substitute — thinking walks your curve and never climbs to the next one, and the
              climb is paid for in a currency page 3&apos;s wall does not price: chains the model
              writes itself, not the finite stock of human text.
            </p>
            <p className="text-xs text-ink-muted">
              OpenAI published both charts with the compute axis unlabeled — a log scale in
              undisclosed, relative units — so the ×1–×100 span and the{" "}
              +{P.slopePerDecade}-per-decade slope are this redrawing&apos;s; the dashed GPT-4o
              line and the o1 dot are verbatim. The slope is the claim; the absolute compute is a
              secret.
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>
            Drag training to ×1 and push thinking to ×100: all that thinking lands exactly where
            the full run <em>starts</em>.
          </p>
        </Note>

        {/* Step 3 — the second storey, and the generality ablation */}
        <section className="flex min-w-0 flex-col gap-4 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">3. Stack the toolbox, or turn the knobs?</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              First answer: stack. Act 2 did not become obsolete — it became the second storey.
              Each increment below is one of its mechanisms, stacked on top of the learned chain,
              on competition maths (AIME 2024):
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
              Second answer: turn the knobs — and OpenAI ran the ablation itself. Take o1 and
              bolt on hand-engineered, contest-specific strategies (
              <strong className="text-ink">o1-ioi</strong>) — Act 2&apos;s move, done by hand at
              the frontier — or just turn the two knobs further. The knob-turning branch, an
              early <strong className="text-ink">o3</strong>, beat the hand-built specialist on
              its own contest, no tricks attached.
              <Cite n={REF.competitive} /> Their conclusion, verbatim: scaling
              &ldquo;general-purpose reinforcement learning, rather than relying on
              domain-specific techniques, offers a robust path toward state-of-the-art
              AI&rdquo;.
              <Cite n={REF.competitive} />{" "}
              <strong className="text-ink">Stacking pays once; the knobs compound.</strong>
            </p>
          </div>
        </section>

        <div aria-hidden="true" />

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

      <PageNav n={PAGE_N} />
    </article>
  );
}
