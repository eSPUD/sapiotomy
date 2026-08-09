"use client";

/**
 * Page 12, "Teaching Models to Reason: STaR and Self-Improvement". Every tool
 * in the act so far spends its compute at answer time and throws the reasoning
 * away. STaR (Zelikman et al. 2022) is the bridge from inference-time back to
 * train-time: a chain that reached a verified answer is a worked solution the
 * model wrote for itself — training data. Generate, keep what checks out,
 * fine-tune, repeat.
 *
 * Section 1 is the loop itself (lib/star.ts): the animated loop graph (StarLoop)
 * above its centerpiece, a chart of the whole run computed at once for the
 * current toggles — no step-through — in the
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
 * Section 1 also carries the loop written down (merged in from the former
 * section 2): the paper's Algorithm 1 compressed to ten annotated pseudocode
 * lines, directly under the interactive so the reader parses the mechanism
 * they just ran. A plain-language walkthrough sits below the listing as the
 * safety net for readers who bounced off the pseudocode; the annotation column
 * carries the RL mapping.
 *
 * Section 2 is the paper's Table 1 (data/star-cqa.json), quoted verbatim: 6B
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

import { useEffect, useMemo, useRef, useState } from "react";
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

/** A point and a cubic edge between two node centres. */
type Pt = [number, number];
type Edge = { p0: Pt; p1: Pt; p2: Pt; p3: Pt };

/** Point on cubic Bézier `e` at parameter `t`. */
function bezier(e: Edge, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [
    a * e.p0[0] + b * e.p1[0] + c * e.p2[0] + d * e.p3[0],
    a * e.p0[1] + b * e.p1[1] + c * e.p2[1] + d * e.p3[1],
  ];
}

/** The SVG `d` for an edge, so the wire and the signal share one geometry. */
const edgeD = (e: Edge) =>
  `M${e.p0[0]} ${e.p0[1]} C ${e.p1[0]} ${e.p1[1]} ${e.p2[0]} ${e.p2[1]} ${e.p3[0]} ${e.p3[1]}`;

/** The four node centres, laid out as a diamond. */
const N_GEN: Pt = [240, 46];
const N_FILTER: Pt = [392, 162];
const N_RAT: Pt = [240, 278];
const N_TUNE: Pt = [88, 162];

/**
 * The loop the signal travels, in order: generate → filter → rationalize →
 * fine-tune → back. Each edge bows outward so the four make a rounded diamond;
 * the corners sit at node centres, hidden behind the boxes.
 */
const EDGES: Edge[] = [
  { p0: N_GEN, p1: [330, 60], p2: [380, 110], p3: N_FILTER },
  { p0: N_FILTER, p1: [392, 216], p2: [330, 260], p3: N_RAT },
  { p0: N_RAT, p1: [150, 260], p2: [90, 216], p3: N_TUNE },
  { p0: N_TUNE, p1: [102, 110], p2: [150, 60], p3: N_GEN },
];

/** The shortcut a correct answer takes: straight from filter to fine-tune. */
const SHORTCUT: Edge = { p0: N_FILTER, p1: [300, 150], p2: [180, 150], p3: N_TUNE };

/* A highlighted node gets a solid compute fill (not a translucent tint), so its
 * text flips light to stay legible. Full literals, so Tailwind's JIT emits them. */
const RECT_BASE = "fill-surface-raised stroke-grid";
const RECT_HOT = "fill-compute stroke-compute";
const TITLE_BASE = "fill-ink text-[13px] font-semibold";
const TITLE_HOT = "fill-canvas text-[13px] font-semibold";
const SUB_BASE = "fill-ink-muted text-[10px]";
const SUB_HOT = "fill-grid text-[10px]";

/** A direction chevron at an edge's midpoint, angled along its chord. */
function Chevron({ e, cls = "fill-ink-muted" }: { e: Edge; cls?: string }) {
  const [mx, my] = bezier(e, 0.5);
  const deg = (Math.atan2(e.p3[1] - e.p0[1], e.p3[0] - e.p0[0]) * 180) / Math.PI;
  return (
    <path
      d="M0,0 L-8,-4 L-8,4 Z"
      transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)}) rotate(${deg.toFixed(1)})`}
      className={cls}
    />
  );
}

/**
 * Section 1's loop graph — STaR's cycle with the paper's rationalization branch:
 * generate a rationale, check the answer, KEEP it if it is right; if it is
 * wrong, hand the correct answer back as a hint and let the model RATIONALIZE
 * its way to that answer, then keep the survivor; fine-tune the base model on
 * the keepers and repeat.
 *
 * A single signal rides the wire (evaluated on EDGES, so it is exactly on the
 * line). It is staged, not constant: it travels an edge, then dwells at the
 * node it reaches while that node lights up, then moves on. Driven by rAF over
 * refs (no per-frame React render) and skipped under prefers-reduced-motion,
 * which leaves the static wire, chevrons and labels. The filter node's label
 * echoes the correctness-filter toggle below.
 */
function StarLoop({ filter }: { filter: boolean }) {
  // Two signals: A carries the trunk (generate→filter, fine-tune→generate) and,
  // during the split, the correct-answer shortcut; B carries the wrong-answer
  // detour through rationalize. Both leave filter together and are timed to
  // reach fine-tune at the same instant.
  const dotARef = useRef<SVGCircleElement | null>(null);
  const dotBRef = useRef<SVGCircleElement | null>(null);
  const rectRefs = useRef<(SVGRectElement | null)[]>([]);
  const titleRefs = useRef<(SVGTextElement | null)[]>([]);
  const subRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // Phase durations (ms). The split (SP) is shared by both paths, so they
    // arrive at fine-tune together: the correct dot eases the whole SP along the
    // shortcut while the wrong dot spends it on F→R, a dwell, then R→FT.
    const DG = 480, GF = 620, DF = 480, SP = 1200, DFT = 480, FTG = 620;
    const S1 = 440, SD = 320, S2 = SP - S1 - SD; // F→R, rationalize dwell, R→FT
    const B = [DG, DG + GF, DG + GF + DF, DG + GF + DF + SP, DG + GF + DF + SP + DFT];
    const TOTAL = B[4] + FTG;
    let raf = 0;
    let start = 0;
    const place = (ref: typeof dotARef, x: number, y: number, vis: boolean) => {
      const el = ref.current;
      if (!el) return;
      if (!vis) return void el.setAttribute("opacity", "0");
      el.setAttribute("cx", x.toFixed(2));
      el.setAttribute("cy", y.toFixed(2));
      el.setAttribute("opacity", "1");
    };
    const tick = (now: number) => {
      if (!start) start = now;
      const e = (now - start) % TOTAL;
      let hi = -1;
      let a: [number, number] | null = null;
      let b: [number, number] | null = null;
      if (e < B[0]) {
        hi = 0; // dwell at generate
      } else if (e < B[1]) {
        a = bezier(EDGES[0], (e - B[0]) / GF); // generate → filter
      } else if (e < B[2]) {
        hi = 1; // dwell at filter
      } else if (e < B[3]) {
        const ls = e - B[2]; // the split
        a = bezier(SHORTCUT, ls / SP); // correct answer, straight to fine-tune
        if (ls < S1) b = bezier(EDGES[1], ls / S1); // wrong answer → rationalize
        else if (ls < S1 + SD) hi = 2; // rationalize with the hint (dwell)
        else b = bezier(EDGES[2], (ls - S1 - SD) / S2); // rationalized → fine-tune
      } else if (e < B[4]) {
        hi = 3; // both have arrived: dwell at fine-tune
      } else {
        a = bezier(EDGES[3], (e - B[4]) / FTG); // fine-tune → generate
      }
      for (let i = 0; i < rectRefs.current.length; i++) {
        const hot = i === hi;
        rectRefs.current[i]?.setAttribute("class", hot ? RECT_HOT : RECT_BASE);
        titleRefs.current[i]?.setAttribute("class", hot ? TITLE_HOT : TITLE_BASE);
        subRefs.current[i]?.setAttribute("class", hot ? SUB_HOT : SUB_BASE);
      }
      // tint the trunk signal green while it rides the correct-answer shortcut
      dotARef.current?.setAttribute("class", e >= B[2] && e < B[3] ? "fill-correct" : "fill-compute");
      place(dotARef, a ? a[0] : 0, a ? a[1] : 0, !!a);
      place(dotBRef, b ? b[0] : 0, b ? b[1] : 0, !!b);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nodes = [
    { x: 164, y: 23, title: "generate", sub: "a rationale + answer" },
    {
      x: 316,
      y: 139,
      title: filter ? "filter" : "filter (off)",
      sub: filter ? "answer vs. the key" : "no key: keep all",
    },
    { x: 164, y: 255, title: "rationalize", sub: "hint = the answer" },
    { x: 12, y: 139, title: "fine-tune", sub: "base model, on keepers" },
  ];

  return (
    <svg
      viewBox="0 0 480 324"
      role="img"
      aria-label={`STaR's loop. Generate a rationale and answer. Filter: ${
        filter ? "check the answer against the key" : "the key is off, so every rationale is kept"
      }. A correct answer is kept directly. A wrong one is handed the correct answer as a hint, and the model rationalizes its way to that answer; the successful rationalization is kept too. The base model is fine-tuned on the keepers, and the loop repeats.`}
      className="mx-auto w-full max-w-[480px]"
    >
      {/* the correct-answer shortcut: dashed, straight from filter to fine-tune */}
      <path d={edgeD(SHORTCUT)} fill="none" strokeWidth={1.6} strokeDasharray="5 4" className="stroke-ink-muted" />
      <Chevron e={SHORTCUT} cls="fill-correct" />
      <text x={240} y={148} textAnchor="middle" className="fill-correct text-[11px] font-semibold">
        correct ✓ keep
      </text>

      {/* the loop wire: the four edges the signal travels */}
      <g fill="none" strokeWidth={2} className="stroke-ink-muted">
        {EDGES.map((e, i) => (
          <path key={i} d={edgeD(e)} />
        ))}
      </g>

      {/* direction chevrons at each edge midpoint */}
      {EDGES.map((e, i) => (
        <Chevron key={i} e={e} />
      ))}

      {/* branch labels: the wrong-answer path and its hint-driven recovery */}
      <text x={432} y={214} textAnchor="middle" className="fill-wrong text-[11px] font-semibold">
        wrong ✗
      </text>
      <text x={150} y={250} textAnchor="middle" className="fill-correct text-[11px] font-semibold">
        ✓ kept
      </text>
      <text x={70} y={108} textAnchor="middle" className="fill-ink-muted text-[11px]">
        ↺ repeat
      </text>

      {/* the travelling signals (positioned by the rAF loop); hidden while dwelling.
          A = trunk, tinted green on the correct-answer shortcut; B = wrong-answer detour */}
      <circle ref={dotARef} cx={N_GEN[0]} cy={N_GEN[1]} r={5.5} opacity={0} className="fill-compute" />
      <circle ref={dotBRef} cx={N_FILTER[0]} cy={N_FILTER[1]} r={5.5} opacity={0} className="fill-compute" />

      {/* the four nodes; each fills solid compute when the signal dwells on it */}
      {nodes.map((n, i) => (
        <g key={n.title}>
          <rect
            ref={(el) => {
              rectRefs.current[i] = el;
            }}
            x={n.x}
            y={n.y}
            width={152}
            height={46}
            rx={10}
            className={RECT_BASE}
          />
          <text
            ref={(el) => {
              titleRefs.current[i] = el;
            }}
            x={n.x + 76}
            y={n.y + 20}
            textAnchor="middle"
            className={TITLE_BASE}
          >
            {n.title}
          </text>
          <text
            ref={(el) => {
              subRefs.current[i] = el;
            }}
            x={n.x + 76}
            y={n.y + 35}
            textAnchor="middle"
            className={SUB_BASE}
          >
            {n.sub}
          </text>
        </g>
      ))}
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

  const [rationalize, setRationalize] = useState(false);
  const [filter, setFilter] = useState(true);

  // The whole run at once — no step-through. The mechanism is seeded
  // (STAR_SEED), so this is deterministic and safe to compute in render.
  const history = useMemo(() => {
    const h: StarIteration[] = [starBase(POOL)];
    for (let i = 0; i < STAR_MAX_ITERS; i++) {
      h.push(starStep(POOL, h[h.length - 1], { filter, rationalize }));
    }
    return h;
  }, [filter, rationalize]);

  const now = history[history.length - 1];
  const trainSize = now.verified + now.rationalized + now.wrong;

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
            {/* the loop itself, with the rationalization branch, signal animated to turn */}
            <StarLoop filter={filter} />

            <p className="text-sm text-ink">
              This is <strong>STaR</strong>&apos;s loop.
              <Cite n={REF.star} /> It still needs a dataset — questions <em>with correct
              answers</em> — but nobody has to write the reasoning; the model authors that itself.
              The chart below runs the whole loop at once: each iteration trains on what survived,
              then tests on held-out problems the loop never touches.
            </p>

            {/* controls: the two toggles that reshape the whole run */}
            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
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
            {!filter ? (
              <p className="rounded border-l-4 border-wrong bg-wrong/10 p-2 text-sm text-ink">
                No answer key: every rationale trains, right or wrong — and rationalization is
                impossible, because a hint requires knowing the answer.
              </p>
            ) : null}

            {/* readouts — the whole run as curves, the big number as the final result */}
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
                  label={`on held-out problems, after ${STAR_MAX_ITERS} iterations`}
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

          {/* the loop written down — merged in from the former section 2 */}
          <h3 className="mt-2 text-lg font-semibold text-ink">The loop, written down</h3>

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

        {/* Merged section 1's margin: what you're watching, then every ref it uses. */}
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
            <RefItem n={REF.exit} href="https://arxiv.org/abs/1705.08439">
              Anthony, Tian &amp; Barber 2017, <em>Thinking Fast and Slow with Deep Learning and
              Tree Search</em>, NeurIPS 2017.
            </RefItem>
            <RefItem n={REF.rft} href="https://arxiv.org/abs/2308.01825" preprint>
              Yuan et al. 2023, <em>Scaling Relationship on Learning Mathematical Reasoning with
              Large Language Models</em>.
            </RefItem>
          </Note>
        </div>

        {/* Section 2 (was 3) — the paper's result, closing on the loop graph */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. What the loop bought
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
          <strong className="text-ink">Cited</strong> — the results in section 2 are from Zelikman
          et al. 2022, Table 1, CommonsenseQA dev.
        </p>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
