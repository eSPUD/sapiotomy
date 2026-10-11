"use client";

/**
 * Page 13, "Frontier Reasoners I: o1, o3, and the Two-Axis Scaling Curve".
 * Page 12 closed on a promise — o1 keeps the loop's shape and drops the
 * disguise — and this page holds it to that promise with abstractions, not
 * announcement transcription. The reader should leave with three things the
 * literature never states in one place: the loop-diff (section 1), the
 * unified two-knob law (section 2), and the visibility boundary (section 4).
 *
 * The lede picks up page 12's closing block, which names the two ways to buy
 * reasoning (Act 2's toolbox spends once the question lands; page 12's loop
 * spends long before it does) and hands over. The lede reaches the same pair
 * before saying o1 turns both dials, so section 2's two compute axes land as
 * the reader's own question answered rather than a new frame. Two claims are
 * banned here: "everything so far bolted reasoning on from outside" (page 12
 * already trained it in, so it reads as a skipped page) and anything implying
 * this page opens Act 3 — the seam is 11|12, so Act 3 started on page 12 and
 * this is its second page. See pages.ts for why.
 *
 * The seam must RHYME, not repeat (review). An earlier lede reached the pair
 * in page 12's own words — "two ways to buy reasoning", "spend once the
 * question lands", "spend long before it does" — which put ~20 words of
 * near-verbatim overlap on either side of a page turn, so the reader re-read a
 * sentence instead of recognising a shape. The structure is what carries the
 * seam (two modes, each with its page pointer, then o1 doing both, then the
 * two axes); the wording is deliberately this page's own. Page 12 owns the
 * when ("after the question lands" / "long before the question exists"); this
 * lede owns the where ("spent at answer time" / "already sunk into the
 * weights"), which also sets up section 2's axes more directly, since one axis
 * belongs to each place. Page13.test.tsx pins the divergence with negative
 * assertions, so a later tightening pass cannot drift back into page 12's
 * phrasing.
 *
 * Section 1 is the loop STRIP and nothing else. It used to also print a
 * six-line reconstruction of the o1 recipe, badged "rumored recipe"; that was
 * cut on review 2026-07-30 and must not come back. Three reasons, in order of
 * force: (1) section 4 is titled "The questions o1 cannot answer" and its
 * handoff promises page 14 will deliver "the algorithm in full", so a printed
 * o1 algorithm was a counterexample to this page's own thesis and spent page
 * 14's payoff early; (2) page 14 section 1 prints GRPO, which is real and
 * checkable, and putting a hypothesized listing in the same grammar one page
 * earlier taught the reader that the two have equal standing; (3) a deck whose
 * bar is "better than reading the literature" cannot lead with the one artifact
 * nobody can verify. What survives is the part OpenAI actually confirmed: the
 * three stations, two renamed (filter → reward, fine-tune → reinforce), each
 * sub-label carrying its own diff against page 12's line (one greedy try → k
 * sampled chains, filter → explicit reward, finetune-from-base →
 * reinforce-in-place). The figcaption states the boundary in the deck's voice
 * ("the shape is the whole of what was confirmed") and points at page 14 for
 * an algorithm from a lab that published one. The h2 badge is therefore
 * "confirmed frame only": with the listing gone the page publishes no rumor.
 * The callout below carries the page's two build-ons: no human anywhere in the
 * loop (vs RLHF), and no draw on page 3's finite stock of human text.
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
 * knobs" is legible before anything is dragged. Both dials are named in units
 * before the figure (review: "×10" reads as "ten runs" next to section 3's
 * 64-chain vote and 1000-chain re-rank) — the training dial is compute inside
 * one run, the thinking dial is compute inside one answer, and sampling many
 * answers is section 3's separate purchase. The score is named too: pass@1 on
 * AIME 2024, in the prose, on the y axis, and on the readout; the default
 * (×10, ×10) opens
 * with the bracket showing exactly one decade forgone. The Try-it note is a
 * single imperative sentence, page 2's margin grammar — the interpretation
 * lives in the card's closing line, where the deck puts meaning. That line
 * used to say the dials "do not substitute", which the parametrization
 * contradicts: the two exponents enter as a sum, so law(2,0) = law(0,2) = 21.0
 * and a decade of one is exactly a decade of the other. It now states the
 * equality and puts the real asymmetry where it belongs, in WHEN the compute is
 * bought (RL once, thinking on every answer). Do not reintroduce a
 * non-substitution claim without changing the law it describes. The fidelity
 * note discloses the joint surface itself as authored, not just its span and
 * slope: the announcement published two SEPARATE charts, and one shared law in
 * which training is a pure horizontal shift appears in no source. "The slope is
 * the claim; the absolute compute is a secret" survives on purpose — it is
 * itself an abstraction (labs publish shapes, not units).
 *
 * Section 3 is one question asked twice — "Stack the toolbox, or turn the
 * knobs?" The bars are the stacking answer (Act 2's tricks as a second storey
 * on the learned chain; rows are mechanisms, model names demoted to
 * parentheses). They used to be a WATERFALL, each row starting where the last
 * ended and printing an invented +8.9 and +9.7; that was wrong and must not
 * come back. The announcement reports 74.4 pass@1, 83.3 with consensus among 64
 * samples and 93 re-ranking 1000 samples as three readings of ONE model, so
 * re-ranking is an alternative to the 64-way vote, not a storey on top of it,
 * and the increments between them are nowhere in the source. The rows are
 * therefore drawn from a common zero and print absolute scores only, with the
 * three o1 readings grouped under their own heading, so the 74.4-to-93 gap
 * reads as one model measured three ways. (That grouping was also what the
 * scoreboard page's first courtroom case ran on; the page was cut 2026-08-10
 * and the grouping is right on its own terms, so it stays.) The
 * knob answer is El-Kishky's own ablation, compressed to
 * one paragraph in the deck's vocabulary — o1-ioi is the toolbox bolted on
 * by hand at the frontier, an early o3 is the knobs turned further, and the
 * knobs won — with the paper's conclusion as the one verbatim anchor. No
 * benchmark numbers anywhere: the medals, percentiles, and the AIME pair
 * were reviewed out as retelling. They used to live on page 15 (The
 * Scoreboard); that page was cut on 2026-08-10, so the deck no longer teaches
 * how to read a benchmark score anywhere. Page 15's contamination callout is
 * all that is left of it. Do not answer that by importing the medals back
 * here: they were retelling before the cut and they still are.
 * o3-preview.json is no longer read here (its reference dropped off the
 * page).
 *
 * Section 4 is the page's epistemic close, restructured after review: it used
 * to be a safety essay (the case for hiding, the monitor's deception rate, the
 * price of an unauditable chain) that related to inference-time scaling
 * through exactly one ledger cell, and duplicated the faithfulness page's
 * charter besides — old page 18 section 3 ("Why not train the thoughts to be
 * good?") made the don't-train-the-chain argument at length. That page was cut
 * on 2026-08-10, but the first reason stands on its own: the essay was off this
 * page's subject then and still is. What page 13 owes the reader here
 * is instead what a CLOSED model cannot be asked, so the ledger is gone and
 * the section is four questions. Every one is aimed at the thinking dial
 * rather than at o1's opacity in general (review: an earlier set asked about
 * the algorithm and about emergence, which any closed system would provoke and
 * which left the deck's own subject behind). What survives is what a buyer of
 * test-time compute cannot learn: whether ×10 thinking is one long chain or a
 * hidden vote (the distinction section 2 has to assert and cannot prove),
 * whether the billed tokens are load-bearing, what the extra tokens actually
 * do, and whether the law needs frontier scale at all. Two earlier drafts were
 * rejected on the way here — a ledger whose columns read "what this page
 * claimed / what backs it" (a page narrating its own contributions is an
 * academic-paper reflex that puts the reader outside the story) and a parts
 * list of what OpenAI shipped versus kept (better subject, still a
 * retrospective). The questions are not rhetorical: page 14 answers all four
 * in this order (the visible chain settles what ×N thinking buys and whether
 * it is load-bearing, the R1-Zero curve's response-length axis and its aha
 * loops say what the extra tokens do, the 1.5B-to-70B distills answer scale),
 * and the handoff promises exactly those.
 * Plain numbered prose, no card — house rule for a section of short ideas. Deliberately absent: any back-reference chain through
 * Act 2's pages (review: "lets not cite everything like page 6, page 7…"), the
 * 0.17% deception stat (a system-card number, and the faithfulness page that
 * was going to spend it was cut; it does not come back here), and the
 * safety argument itself. Every cell still carries words (review: an em-dash
 * cell reads as a rendering bug); the sealed column carries tone so the
 * nothing-to-everything gradient is scannable.
 *
 * No Simulated/Cited footer (review): pages 1-3 carry none either —
 * provenance is declared inline, in the h2 badges, section 1's caption, and
 * section 2's fidelity note.
 *
 * Anchored to data/o1-scaling.json; the law and the printed anchors are
 * pinned in frontier.test.ts, the page's structure in Page13.test.tsx.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
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
const REF = { announce: 1, competitive: 2 } as const;

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
const RUN_HUES: Record<number, { stroke: string; fill: string; text: string; label: string }> = {
  0: { stroke: "stroke-wrong", fill: "fill-wrong", text: "fill-wrong-ink", label: "×1" },
  1: { stroke: "stroke-compute", fill: "fill-compute", text: "fill-compute-ink", label: "×10" },
  2: { stroke: "stroke-correct", fill: "fill-correct", text: "fill-correct-ink", label: "×100 RL" },
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

  const title = `AIME 2024 pass at 1 accuracy against thinking compute per problem, log x axis, redrawn in relative units. Three RL training runs, each one run at a different training-compute budget, are drawn in full as parallel lines: the times 100 run climbs from ${law(0, 2).toFixed(0)} to ${law(2, 2).toFixed(0)} percent across two decades; the times 10 run is the same line one decade right, ending at ${law(2, 1).toFixed(1)} percent; the times 1 run barely leaves the floor, ending at ${law(2, 0).toFixed(0)} percent. Staircase arrows on the times 10 run show that times 10 more RL and times 10 more thinking buy the same ${P.slopePerDecade} points. A dashed reference marks GPT-4o at ${P.gpt4oAime} percent; o1's published pass at 1 of ${P.o1Pass1} percent sits as a dot on the times 100 run. Your marker: the times ${Math.round(10 ** trainExp)} run at times ${Math.round(10 ** testExp)} thinking, scoring ${acc.toFixed(1)} percent${gap > 0 ? `, with ${gap.toFixed(1)} points forgone to the missing RL` : ""}.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="thinking per problem (relative compute, log scale)"
      yLabel="AIME 2024 pass@1 (%)"
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
              className={`text-[10px] ${hue.text} ${selected ? "font-semibold" : ""}`}
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
            className="fill-compute-ink text-[10px] font-semibold"
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


/*
 * Section 4's four questions: the things a closed model cannot be asked, each
 * one a door page 14 opens (GRPO in full, the R1-Zero training curve with its
 * emergence annotation, the readable trace, the 1.5B-to-70B distills). Every
 * question is about mechanism, which is the section's one line; the closing
 * handoff answers them in the same order they are asked.
 */
const OPEN_QUESTIONS: { q: string; why: string }[] = [
  {
    q: "What are you actually buying when you turn the thinking dial?",
    why: "One chain allowed to run longer, or many chains sampled and voted on behind the API? The bill counts tokens either way, and nothing visible from outside tells the two apart.",
  },
  {
    q: "Are the thinking tokens doing the work, or describing it?",
    why: "They are priced by the thousand and never shown, so there is no way to check whether the private chain is the reasoning itself or a narration running alongside it.",
  },
  {
    q: "What does the model do with ten times the thinking that it would not do with one?",
    why: "From outside you watch the score climb and the bill climb with nothing in between. The mechanism the whole test-time axis rests on is the one part never shown.",
  },
  {
    q: "Does the law need a frontier-scale model at all?",
    why: "o1 sells in one size, at one price. If trained-in reasoning survives in something small enough to run yourself, thinking gets cheap and the economics of the entire curve change.",
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

/**
 * One bar in section 3's figure. Every bar is drawn from a common zero and
 * carries its own published score: the readings are alternatives, so none of
 * them may start where another ended.
 */
function Reading({
  label,
  note,
  value,
  tone,
}: {
  label: string;
  note: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-44 shrink-0 text-ink-muted">
        {label}
        <span className="block text-xs text-ink-muted">{note}</span>
      </span>
      <div className="relative h-5 flex-1 rounded bg-surface-raised">
        <div className={`absolute left-0 h-5 rounded ${tone}`} style={{ width: `${value}%` }} />
      </div>
      <span className="w-16 shrink-0 text-right font-mono font-semibold tabular-nums text-ink">
        {value}%
      </span>
    </div>
  );
}

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
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

  /*
   * Section 3's three readings: one o1, one benchmark, three sampling budgets.
   * The announcement reports them as alternatives for the same model, so they
   * are three bars from a common zero, never an additive stack.
   */
  const readings = [
    {
      label: "one chain",
      note: "the private chain answers once, scored pass@1",
      value: P.o1Pass1,
      tone: "bg-compute",
    },
    {
      label: "page 7's voting",
      note: "the majority answer across 64 of those chains",
      value: P.o1Cons64,
      tone: "bg-compute",
    },
    {
      label: "page 8's re-ranker",
      note: "a learned judge picks one of 1000 of those chains",
      value: P.o1Rerank1000,
      tone: "bg-correct",
    },
  ];

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="text-lg text-ink-muted">
        By page 12, compute had split in two: the compute spent at answer time (pages 5 to 11:
        votes, judges, search) and the compute already sunk into the weights (page 12: the reasoning
        trained in). <strong className="text-ink">o1</strong> is the first commercial model to
        turn both dials, and it kept the recipe. Its signature is{" "}
        <strong className="text-ink">a curve with two compute axes</strong>: how much of the score
        did the training buy, and how much did the thinking?
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the loop-diff */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            1. The human leaves the loop
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              confirmed frame only
            </span>
          </h2>
          <p className="text-ink-muted">
            Page 12 closed on a promise: same shape, disguise dropped. OpenAI confirmed the
            frame, that o1 is trained with large-scale reinforcement learning to think in a long
            private chain
            <Cite n={REF.announce} />, and its own researchers later named the category:
            &ldquo;large reasoning models (LRMs): language models trained via reinforcement
            learning to &lsquo;reason&rsquo; and &lsquo;think through&rsquo; extended chains of
            thought&rdquo;.
            <Cite n={REF.competitive} /> The algorithm itself was never published.
          </p>

          <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            {/* page 12's loop strip, redrawn: the same three stations, two
                renamed, each carrying its own diff against page 12's line */}
            <div
              className="flex flex-col items-stretch gap-1 sm:flex-row sm:items-center"
              role="img"
              aria-label="Page 12's three-station loop redrawn for o1: generate becomes k sampled chains per problem instead of one greedy try, filter becomes an explicit reward that is still the answer key, and fine-tune becomes reinforce in place on the current model rather than the base model. The loop repeats."
            >
              <Stage
                tone="border-ink"
                title="generate ×k"
                sub="page 12 took one greedy try; k sampled chains explore instead"
              />
              <span className="shrink-0 self-center text-ink-muted" aria-hidden="true">→</span>
              <Stage
                tone="border-correct"
                title="reward"
                sub="page 12's filter, made explicit: still the answer key, still free"
              />
              <span className="shrink-0 self-center text-ink-muted" aria-hidden="true">→</span>
              <Stage
                tone="border-compute"
                title="reinforce"
                sub="page 12 fine-tuned the base; this updates the current model, so gains compound"
              />
              <span className="shrink-0 self-center text-ink-muted" aria-hidden="true">↺</span>
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              Page 12&apos;s strip, redrawn: the same three stations, two renamed, and the
              sub-labels name what each was before.{" "}
              <strong className="text-ink">The shape is the whole of what was confirmed.</strong>{" "}
              This deck will not print a line of o1&apos;s pseudocode, because nobody outside
              OpenAI can check one; page 14 prints an algorithm from the lab that published it.
            </figcaption>
          </figure>

          <p className="rounded border-l-4 border-compute bg-surface p-4 text-sm text-ink">
            Even at this resolution one thing is legible by its absence: a human. RLHF pays people
            to judge outputs; here nobody writes an example and nobody grades one, because the
            model authors the reasoning and the answer key scores it. And the training set never
            touches page 3&apos;s finite stock of human text: the model writes its own curriculum.
          </p>
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
              curve-picker swapped: <strong className="text-ink">RL training picks your curve
              now</strong>.
              <Cite n={REF.announce} /> Both are log-linear, accuracy against the{" "}
              <em>logarithm</em> of compute, whichever axis it arrives on.
            </p>
            <p className="text-sm text-ink-muted">
              Both dials count compute, not attempts.{" "}
              <strong className="text-ink">×100 RL training is one run given a hundred times
              the training compute</strong>, not a hundred runs; ×100 thinking is one answer
              whose private chain is allowed to run a hundred times as long, not a hundred
              sampled answers; sampling many chains and voting is a separate purchase, and
              section 3 stacks it on top. The score being climbed is{" "}
              <strong className="text-ink">pass@1 on AIME 2024</strong>, the same competition
              maths as section 3: fifteen problems, one chain each, graded against the answer key.
            </p>
            <p className="text-sm text-ink-muted">
              All three runs are drawn below: the same line, slid one decade right for every
              decade of RL forgone.{" "}
              <strong className="text-ink">The training dial picks your curve; the thinking dial
              slides your marker along it</strong>, and the bracket at your marker prices what
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
                  label="RL training (compute in one training run)"
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
                  label="Thinking time (compute in one answer)"
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
                  label="AIME 2024 pass@1 here"
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
              The two dials pay the same +{P.slopePerDecade} per decade, and on this surface they
              trade one for one: a decade of thinking buys back exactly the decade of RL you
              skipped, which is why ×1 training with ×100 thinking scores the same{" "}
              {law(2, 0).toFixed(1)} as ×100 training with ×1 thinking. What differs is how often
              you pay. The RL is bought once, before any question arrives, and in a currency page
              3&apos;s wall does not price: chains the model writes itself, not the finite stock of
              human text. The thinking is bought again on every answer.
            </p>
            <p className="text-xs text-ink-muted">
              OpenAI published two separate charts, one per axis, both with the compute axis
              unlabeled: a log scale in undisclosed, relative units. Joining them into one surface,
              so that a decade of either dial buys the same points and training is a clean sideways
              shift, is this deck&apos;s construction and not a published result; so are the ×1 to
              ×100 span and the +{P.slopePerDecade}-per-decade slope. The dashed GPT-4o line and
              the o1 dot are verbatim. The slope is the claim; the absolute compute is a secret.
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
              First answer: stack. Act 2 did not become obsolete; it became the second storey: put
              one of its mechanisms over the learned chain and the score moves. Below, one o1 on
              competition maths (AIME 2024) read three ways, against a strong LLM with no learned
              chain at all:
            </p>
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`AIME 2024, four readings, every bar drawn from a common zero. A strong LLM with no learned chain, GPT-4o, scores ${P.gpt4oAime} percent. The same o1 is then read three ways: ${P.o1Pass1} percent with its private chain answering once, ${P.o1Cons64} percent taking the majority across 64 of those chains with page 7's voting, and ${P.o1Rerank1000} percent when page 8's learned judge picks one of 1000 of those chains. The three o1 readings are alternatives, so no bar starts where another one ends.`}
            >
              <Reading
                label="no learned chain"
                note="one instant answer from a strong LLM (GPT-4o)"
                value={P.gpt4oAime}
                tone="bg-grid"
              />
              <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-2">
                <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">
                  o1, one model read three ways
                </p>
                {readings.map((r) => (
                  <Reading key={r.label} {...r} />
                ))}
              </div>
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
              Every bar starts at zero, because the last three are alternatives and not a ladder:
              the vote and the re-ranker each replace the single chain, and neither runs on the
              other.{" "}
              <strong className="text-ink">Same model, same fifteen problems; what changed is how
              many chains were bought and who picked among them.</strong>
            </figcaption>
          </figure>

          <h3 className="text-lg font-semibold text-ink">
            One recipe, no domain tricks
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              El-Kishky et al. 2025 · IOI 2024
            </span>
          </h3>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              Second answer: turn the knobs, and OpenAI ran the ablation itself. Take o1 and
              bolt on hand-engineered, contest-specific strategies (
              <strong className="text-ink">o1-ioi</strong>), which is Act 2&apos;s move done by
              hand at the frontier, or just turn the two knobs further. The knob-turning branch, an
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

        {/* Step 4 — the evidence audit, and why an open model comes next */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. The questions o1 cannot answer</h2>
          <p className="text-ink-muted">
            The two knobs are priced precisely: a decade of either buys the same +{P.slopePerDecade}
            . What no amount of measuring from outside can tell you is{" "}
            <strong className="text-ink">what you get for the money</strong>. Four questions the
            curve does not answer:
          </p>

          <ol className="flex flex-col gap-4">
            {OPEN_QUESTIONS.map((item, i) => (
              <li key={item.q} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
                <span
                  className="w-5 select-none text-right font-code text-sm tabular-nums text-ink-muted"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{item.q}</p>
                  <p className="text-sm text-ink-muted">{item.why}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="text-sm text-ink-muted">
            Every one of them asks what is behind the thinking dial, and{" "}
            <strong className="text-ink">that is exactly what a closed lab keeps</strong>. It will
            sell you the curve; it will not show you the machine that makes it.
          </p>

          <Handoff>
            Four months later an open lab answered every one of them: the algorithm in full, a chain
            you can read token by token, a training curve that shows where the extra thinking comes
            from, and the whole thing distilled small enough to run yourself.{" "}
            <em className="text-ink-muted">Turn the page.</em>
          </Handoff>
        </section>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
