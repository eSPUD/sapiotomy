"use client";

/**
 * Page 12, "Teaching Models to Reason: STaR and Self-Improvement". Every tool
 * in the act so far spends its compute at answer time and throws the reasoning
 * away. STaR (Zelikman et al. 2022) is the bridge from inference-time back to
 * train-time: a chain that reached a verified answer is a worked solution the
 * model wrote for itself — training data. Generate, keep what checks out,
 * fine-tune, repeat.
 *
 * Section 1 is the loop itself, drawn as the animated loop graph (StarLoop):
 * generate → filter → (correct: keep) / (wrong: rationalize from the answer as a
 * hint → keep) → fine-tune → repeat, with a signal that forks at the filter so
 * both branches reach fine-tune together. The correctness check is always on —
 * the answer key is what the whole loop rests on. The old seeded accuracy chart
 * (lib/star.ts) was removed — it was an illustrative simulation, not measured
 * data, so the page now shows only the mechanism and the cited results.
 *
 * Section 1 also carries the loop written down (merged in from the former
 * section 2): the paper's Algorithm 1 compressed to ten annotated pseudocode
 * lines, so the reader parses the mechanism the diagram animates. A plain-
 * language walkthrough sits below the listing as the safety net for readers who
 * bounced off the pseudocode; the annotation column carries the RL mapping.
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
 * STaR, ExIt and RFT share one References note beside section 1, GVM one beside
 * the closing blocks:
 * ExIt (Anthony et al. 2017) grounds the "this is RL" mapping on line 2, whose
 * exit condition ("until accuracy plateaus") is the loop's own stopping
 * rule; RFT (Yuan et al. 2023) names the sample-k alternative on line 5,
 * whose annotation states the correction that must hold — STaR decodes
 * greedily, one attempt per problem (the paper reports higher temperatures
 * reach more right answers through wrong reasoning), so improvement is
 * generalization, not distilled luck: each round's fine-tuned model is a
 * different model whose greedy output reaches harder problems; and GVM
 * (Yao et al. 2025) gives the
 * counterweight outside evidence that models write wrong reasoning yet land
 * right answers. STaR and RFT are a closely related family, never
 * "synonymous" — GVM separates them on exactly the greedy-vs-sampling axis.
 * The V-STaR/ReST^EM lineage is deliberately omitted — intuition over history.
 *
 * Sidenote convention as on page 2: numbered References notes (Cite/RefItem)
 * beside the sections that use them, provenance footnote at the bottom.
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { NotebookDownload } from "@/components/NotebookDownload";
import { Toggle } from "@/components/Toggle";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { STAR_LINES } from "@/lib/starListing";
import { ModelIcon, UserIcon } from "@/components/ChatIcons";
import {
  PAGE12,
  hasHint,
  modelLabel,
  tidyMath,
  walked,
} from "@/lib/page12";

const PAGE_N = 12;
const N_CHAINS = PAGE12.n_chains;

/** Section 2's run: the notebook, page 7's chains it replays, page 9's step scores, and the hint retry. */
const NOTEBOOK_ZIP = "/notebooks/page-12-star-harvest.zip";
const NOTEBOOK_SIZE = "5.0 MB";

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
  1: { note: "expert iteration (Anthony et al. 2017): the same loop, before LLMs" },
  3: { note: "the only supervision that exists: answers, never reasoning" },
  4: {
    note: "one greedy rollout: low variance, biased exploration; RFT (Yuan et al. 2023) samples k instead",
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
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
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
const TITLE_HOT = "fill-ink text-[13px] font-semibold";
const SUB_BASE = "fill-ink-muted text-[10px]";
const SUB_HOT = "fill-ink text-[10px]";

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
      <text x={240} y={148} textAnchor="middle" className="fill-correct-ink text-[11px] font-semibold">
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
      <text x={432} y={214} textAnchor="middle" className="fill-wrong-ink text-[11px] font-semibold">
        wrong ✗
      </text>
      <text x={104} y={256} textAnchor="middle" className="fill-correct-ink text-[11px] font-semibold">
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
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 py-0.5 sm:min-h-[3rem] sm:grid-cols-[auto_minmax(0,20rem)_minmax(0,1fr)] sm:items-start sm:content-start sm:gap-x-4">
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

/**
 * Section 2's figure: one problem walked through one pass of STaR's loop as published, with
 * nothing trained. The model answers once, greedily; the answer key, shown from the start,
 * is carried over to the model's answer to check it; with rationalization on, a miss is asked
 * again with the answer as a hint and checked the same way; a chain that passes is carried
 * into the training set below the pass, because the reasoning is what the weights would be
 * fitted to. Under the pass, one meter counts the same pass over all 100 problems. The switch
 * is lines 8 and 9 of the listing above; line 5's greedy decoding and line 6's answer key are
 * fixed. (Sampled chains, majority vote and page 9's step grader were all tried here and
 * dropped: the first is the RFT variant, the other two are other methods, and none is STaR.)
 * Every number shown is recomputed from the bundled verdicts, which the load step has
 * already checked against the notebook.
 */
type Tone = "plain" | "right" | "hint";

const TONE_STYLE: Record<Tone, string> = {
  plain: "border-grid bg-surface-raised text-ink-muted",
  right: "border-correct bg-correct/20 text-correct-ink",
  hint: "border-compute bg-compute/20 text-compute-ink",
};

/** One chain as a small card: what it is, and the answer it boxed. */
function ChainChip({ label, answer, tone, dim, title }: {
  label: string;
  answer: string;
  tone: Tone;
  dim?: boolean;
  title: string;
}) {
  const shown = answer ? tidyMath(answer) : "no answer";
  return (
    <span
      role="img"
      title={title}
      aria-label={title}
      className={`flex h-9 min-w-14 flex-col items-center justify-center rounded border px-2 font-mono text-[11px] leading-tight ${TONE_STYLE[tone]} ${
        dim ? "opacity-40" : ""
      }`}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="max-w-full truncate">{shown.length > 12 ? `${shown.slice(0, 11)}…` : shown}</span>
    </span>
  );
}

type Dot = "neutral" | "kept" | "dropped" | "hint" | "skipped";

/** Filled when the step keeps something, hollow when it drops, orange when the hint did it, dashed when skipped. */
const DOT_STYLE: Record<Dot, string> = {
  neutral: "border-ink-muted bg-ink-muted",
  kept: "border-correct bg-correct",
  dropped: "border-ink-muted bg-surface",
  hint: "border-compute bg-compute",
  skipped: "border-dashed border-ink-muted bg-surface",
};

/** One stop on the pass: a dot on a line that runs down to the next stop. */
function PassStep({ label, detail, dot, last, current, children }: {
  label: string;
  detail: string;
  dot: Dot;
  last?: boolean;
  /** The step playback is on. */
  current?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className={`relative flex gap-3 ${last ? "" : "pb-3"}`}>
      {last ? null : <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-4 w-px bg-grid" />}
      <span
        aria-hidden="true"
        className={`relative mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${DOT_STYLE[dot]} ${
          current ? "ring-4 ring-compute/30" : ""
        }`}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm text-ink">
          <span className="font-semibold">{label}</span> <span className="text-ink-muted">· {detail}</span>
        </p>
        {children}
      </div>
    </li>
  );
}

/** The pass over all 100 problems: the greedy chain's lessons, and what rationalization adds. */
const GREEDY_RIGHT = PAGE12.problems.filter((p) => p.greedy.correct).length;
const HINT_RESCUED = PAGE12.problems.filter((p) => !p.greedy.correct && p.hint?.correct).length;

/**
 * Playback is a script of beats, each held for its own time. The first five check the
 * greedy chain: it appears whole, the key and the model's answer are lit, the key is carried
 * over to the answer, the result shows, the key goes home. Then either the chain is carried
 * into the training set (rationalize skipped), or the miss is asked again with a hint and
 * checked the same way, or, with rationalization off, nothing more happens.
 */
type Beat =
  | "gen" | "mark" | "fly" | "cmp" | "back"
  | "skip" | "off"
  | "hint" | "hgen" | "hmark" | "hfly" | "hcmp" | "hback"
  | "drop" | "none";

const BEAT_MS: Record<Beat, number> = {
  gen: 3200, mark: 1800, fly: 1500, cmp: 2000, back: 1300,
  skip: 1800, off: 1800,
  hint: 2400, hgen: 3200, hmark: 1800, hfly: 1500, hcmp: 2000, hback: 1300,
  drop: 2200, none: 1800,
};

/** How long the key and the reasoning take to travel; each sits inside its beat's hold. */
const FLY_MS = 1100;
const DROP_MS = 1500;

function scriptFor(greedyRight: boolean, rationalize: boolean, rescued: boolean): Beat[] {
  const s: Beat[] = ["gen", "mark", "fly", "cmp", "back"];
  if (greedyRight) return [...s, "skip", "drop"];
  if (!rationalize) return [...s, "off", "none"];
  return [...s, "hint", "hgen", "hmark", "hfly", "hcmp", "hback", rescued ? "drop" : "none"];
}

type Box = { x: number; y: number; w: number; h: number };

/**
 * A copy of something on the page carried from one place to another: it starts over `from`
 * and slides and scales onto `to`. The original stays put; the copy is drawn on top.
 */
function Flyer({ from, to, ms, children }: { from: Box; to: Box; ms: number; children: React.ReactNode }) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setGo(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);
  const move = `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(${to.w / from.w}, ${to.h / from.h})`;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ transform: `translate(${from.x}px, ${from.y}px)`, width: from.w, height: from.h }}
    >
      {/* Solid and lifted, so it reads as carried over the page rather than seen through. */}
      <div
        className="h-full w-full rounded bg-surface shadow-lg"
        style={{ transformOrigin: "0 0", transform: go ? move : "none", transition: `transform ${ms}ms cubic-bezier(.4,0,.2,1)` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Clip text for a preview, at a word boundary. */
const clip = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n) > n * 0.6 ? t.lastIndexOf(" ", n) : n)}…`);

/** The answer key as a chip: at home in the pass column, or carried over to the model's answer. */
function KeyChip({ answer, lit = false, faint = false }: { answer: string; lit?: boolean; faint?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-sm transition-all duration-500 ${
        lit ? "border-correct bg-correct/30 ring-4 ring-correct/30" : "border-ink-muted/40 bg-surface-raised"
      } ${faint ? "opacity-25" : ""}`}
    >
      <span className="text-[10px] text-ink-muted">key</span>
      <span className="font-mono font-semibold text-ink">{tidyMath(answer)}</span>
    </span>
  );
}

/** One training example, as it sits in the training set. */
function ExampleCard({ question, reasoning, answer, hinted }: {
  question: string;
  reasoning: string;
  answer: string;
  hinted: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col gap-0.5 overflow-hidden rounded border p-2 font-code text-[11px] leading-snug text-ink ${
        hinted ? "border-compute bg-compute/10" : "border-correct bg-correct/10"
      }`}
    >
      {hinted ? (
        <p className="self-start rounded bg-compute/20 px-1 text-[10px] text-compute-ink">written with the hint; filed without it</p>
      ) : null}
      <p><span className="text-ink-muted">question </span>{clip(tidyMath(question), 48)}</p>
      <p><span className="text-ink-muted">reasoning </span>{clip(tidyMath(reasoning), 64)}</p>
      <p><span className="text-ink-muted">answer </span>{tidyMath(answer)}</p>
    </div>
  );
}

/**
 * As on page 5, the pass starts empty: Play runs it beat by beat and leaves it on screen,
 * Reset clears it. The rationalization switch and the problem arrows sit above it. It is laid
 * out to fit one screen: the pass on the left with the chat on the right, then Play and
 * Reset, then the meter.
 */
function StarHarvest() {
  const problems = walked;
  // On by default: rationalization is part of STaR as published; off is the paper's ablation.
  const [rationalize, setRationalize] = useState(true);
  const [at, setAt] = useState(0);
  // "empty" before Play, "done" once the whole pass is on screen, else the beat playing.
  const [bi, setBi] = useState<number | "empty" | "done">("empty");
  const goTo = (i: number) => {
    setBi("empty");
    setAt((i + problems.length) % problems.length);
  };

  const problem = problems[at];
  const g = problem.greedy;
  const hint = problem.hint;
  const retried = rationalize && !g.correct && hint !== null;
  const rescued = retried && hint!.correct;
  const n = PAGE12.manifest.n_items;
  const inSet = GREEDY_RIGHT + (rationalize ? HINT_RESCUED : 0);
  const pct = (x: number) => `${(100 * x) / n}%`;

  const script = scriptFor(g.correct, rationalize, rescued);
  const playing = typeof bi === "number";
  const beat: Beat | null = playing ? script[bi] : null;
  // Whether the pass has reached a beat: always once it is done, never while empty.
  const reached = (b: Beat) => bi === "done" || (playing && script.indexOf(b) !== -1 && script.indexOf(b) <= bi);
  const on = (...bs: Beat[]) => beat !== null && bs.includes(beat);
  // Whether a beat is over: always once the pass is done.
  const past = (b: Beat) => bi === "done" || (playing && script.indexOf(b) !== -1 && script.indexOf(b) < bi);

  // Keyed on the script's contents, not the array, so a re-render mid-beat does not restart the clock.
  const nBeats = script.length;
  const holdMs = playing ? BEAT_MS[script[bi]] : 0;
  useEffect(() => {
    if (typeof bi !== "number") return;
    const t = setTimeout(() => setBi(bi + 1 >= nBeats ? "done" : bi + 1), holdMs);
    return () => clearTimeout(t);
  }, [bi, nBeats, holdMs]);

  const play = () => {
    // Reduced motion: no animation; the whole pass appears at once.
    const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    setBi(reduced ? "done" : 0);
  };
  const reset = () => setBi("empty");

  // Where things are, for the copies that travel between them.
  const figRef = useRef<HTMLElement>(null);
  const keyHome = useRef<HTMLSpanElement>(null);
  const keyLanding = useRef<HTMLSpanElement>(null);
  const replyBox = useRef<HTMLParagraphElement>(null);
  const trayCard = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<{ id: string; kind: "key" | "card"; from: Box; to: Box; ms: number } | null>(null);
  useLayoutEffect(() => {
    const fig = figRef.current;
    const box = (el: HTMLElement | null): Box | null => {
      if (!fig || !el) return null;
      const f = fig.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return { x: r.left - f.left, y: r.top - f.top, w: r.width || 1, h: r.height || 1 };
    };
    const home = box(keyHome.current), land = box(keyLanding.current);
    const id = `${at}-${String(bi)}`;
    if (on("fly", "hfly") && home && land) setFlight({ id, kind: "key", from: home, to: land, ms: FLY_MS });
    else if (on("cmp", "hcmp") && land) setFlight({ id, kind: "key", from: land, to: land, ms: 0 });
    else if (on("back", "hback") && home && land) setFlight({ id, kind: "key", from: land, to: home, ms: FLY_MS });
    else if (on("drop")) {
      const from = box(replyBox.current), to = box(trayCard.current);
      setFlight(from && to ? { id, kind: "card", from, to, ms: DROP_MS } : null);
    } else setFlight(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bi, at]);

  // The headline follows the switch, so it never describes a retry that has not happened.
  const headline = g.correct
    ? "The greedy chain is right, so its reasoning goes in."
    : !retried
      ? "The greedy chain misses, so nothing goes in."
      : !rescued
        ? "The greedy chain misses, and so does the hinted retry."
        : hint!.mentions_hint
          ? "The greedy chain misses; with the hint, the model reaches the answer by leaning on it."
          : "The greedy chain misses; with the answer as a hint, the model finds the route.";

  // What the chat shows: the greedy exchange until the retry starts, then the hinted one.
  const hinted = retried && reached("hint");
  const replyText = hinted ? (reached("hgen") ? hint!.trace : null) : reached("gen") ? g.trace : null;
  const modelAnswer = hinted ? hint!.answer : g.extracted_answer;
  const matched = hinted ? hint!.correct : g.correct;
  // The check is settled once the key is home again.
  const checked = hinted ? past("hback") : past("back");
  const keyLit = on("mark", "fly", "cmp", "back", "hmark", "hfly", "hcmp", "hback");
  const modelLit = on("mark", "fly", "cmp", "back", "hmark", "hfly", "hcmp", "hback");
  const keyAway = on("fly", "cmp", "back", "hfly", "hcmp", "hback");
  const kept: { trace: string; hinted: boolean } | null = g.correct
    ? { trace: g.trace, hinted: false }
    : rescued
      ? { trace: hint!.trace, hinted: true }
      : null;
  const cardIn = bi === "done" || (on("drop") && flight === null);

  const steps = [
    reached("gen"),
    reached("mark"),
    reached("skip") || reached("off") || reached("hint"),
    reached("drop") || reached("none"),
  ];
  const lastShown = steps.lastIndexOf(true);

  return (
    <figure ref={figRef} className="relative m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-3">
      {/* The switch, and which problem is shown. */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        {hasHint ? (
          <div className="flex flex-col gap-0.5">
            <Toggle
              label="Rationalization (lines 8 and 9)"
              checked={rationalize}
              onChange={(v) => {
                // Mid-play, show the whole pass at once; an empty pass stays empty.
                setBi((b) => (b === "empty" ? "empty" : "done"));
                setRationalize(v);
              }}
            />
            {rationalize ? null : (
              <span className="text-[11px] text-ink-muted">Off: STaR without rationalization, the paper&apos;s ablation.</span>
            )}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">
            problem {at + 1} of {problems.length}
          </span>
          <button type="button" aria-label="previous problem" onClick={() => goTo(at - 1)} className="rounded border border-grid px-2 py-0.5 text-xs text-ink hover:border-compute">
            ←
          </button>
          <button type="button" aria-label="next problem" onClick={() => goTo(at + 1)} className="rounded border border-grid px-2 py-0.5 text-xs text-ink hover:border-compute">
            →
          </button>
        </div>
      </div>

      {/* The pass for one problem, beside the chat. */}
      <div className="grid gap-3 rounded-lg border border-grid bg-canvas p-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-sm font-semibold text-ink">
            {bi === "done" ? headline : playing ? "One pass of STaR, step by step." : "Press Play to run one pass of STaR on this problem."}
          </p>
          {/* The answer key, shown from the start: its home, where it leaves from and comes back to. */}
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            The answer key for this problem:
            <span ref={keyHome}>
              <KeyChip answer={problem.ground_truth} lit={keyLit} faint={keyAway} />
            </span>
          </p>

          <ol className="m-0 flex list-none flex-col p-0" aria-label="STaR's pass for this problem">
            {steps[0] ? (
              <PassStep label="Generate" detail="one chain, decoded greedily" dot="neutral" last={lastShown === 0} current={on("gen")}>
                <div className="flex gap-1" role="group" aria-label="the one chain decoded greedily for this problem">
                  <ChainChip
                    label="greedy"
                    answer={g.extracted_answer}
                    tone={reached("back") && g.correct ? "right" : "plain"}
                    dim={reached("back") && !g.correct}
                    title={`the greedy chain: answered ${g.extracted_answer ? tidyMath(g.extracted_answer) : "nothing"}`}
                  />
                </div>
              </PassStep>
            ) : null}
            {steps[1] ? (
              <PassStep
                label="Filter"
                detail="against the answer key"
                dot={reached("back") ? (g.correct ? "kept" : "dropped") : "neutral"}
                last={lastShown === 1}
                current={on("mark", "fly", "cmp", "back")}
              >
                <p className="text-sm text-ink">
                  {!reached("back")
                    ? "The key is carried over to the model's answer."
                    : g.correct
                      ? "It matches, so it is kept."
                      : rationalize
                        ? "It misses."
                        : "It misses, so it is dropped."}
                </p>
              </PassStep>
            ) : null}
            {steps[2] ? (
              <PassStep
                label="Rationalize"
                detail="retry with the answer as a hint"
                dot={g.correct ? "skipped" : !retried ? "skipped" : reached("hback") ? (rescued ? "hint" : "dropped") : "neutral"}
                last={lastShown === 2}
                current={on("skip", "off", "hint", "hgen", "hmark", "hfly", "hcmp", "hback")}
              >
                {g.correct ? (
                  <p className="text-sm text-ink-muted">Skipped: no hint needed, so the chain goes straight to the training set.</p>
                ) : !retried ? (
                  <p className="text-sm text-ink-muted">Off: the miss is not retried.</p>
                ) : (
                  <div className="flex items-center gap-2">
                    {reached("hgen") ? (
                      <ChainChip
                        label="hinted"
                        answer={hint!.answer}
                        tone={reached("hback") && rescued ? "hint" : "plain"}
                        dim={reached("hback") && !rescued}
                        title={`the hinted chain: answered ${hint!.answer ? tidyMath(hint!.answer) : "nothing"}`}
                      />
                    ) : null}
                    <p className="text-sm text-ink">
                      {!reached("hback")
                        ? "Asked again, with the answer given as a hint, and checked the same way."
                        : rescued
                          ? "It reaches the answer: kept, with the hint deleted from the question."
                          : "Even told the answer, it misses, so nothing is kept."}
                    </p>
                  </div>
                )}
              </PassStep>
            ) : null}
            {steps[3] ? (
              <PassStep
                label="Training set"
                detail="what the weights are fitted to"
                dot={g.correct ? "kept" : rescued ? "hint" : "dropped"}
                last
                current={on("drop", "none")}
              >
                <div className="flex flex-col gap-1.5 rounded-lg border-2 border-dashed border-grid bg-surface p-2" aria-label="the training set">
                  <p className="text-sm text-ink">
                    <strong>Selected by the answer. Trained on the reasoning.</strong>{" "}
                    {kept === null ? <span className="text-ink-muted">Nothing from this problem.</span> : null}
                  </p>
                  {kept === null ? null : (
                    <div
                      ref={trayCard}
                      className={`motion-safe:transition-opacity motion-safe:duration-300 ${cardIn ? "opacity-100" : "opacity-0"}`}
                    >
                      <ExampleCard question={problem.question} reasoning={kept.trace} answer={problem.ground_truth} hinted={kept.hinted} />
                    </div>
                  )}
                </div>
              </PassStep>
            ) : null}
          </ol>
        </div>

        {/* The chat: the question (and, on the retry, the hint), the reasoning, and the model's answer. */}
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold text-ink">
            {problem.subject} <span className="font-normal text-ink-muted">· level {problem.level}</span>
          </p>
          <Step>
            {!hinted
              ? !reached("back")
                ? "The greedy chain"
                : g.correct
                  ? "The greedy chain, as it would be trained on"
                  : "The greedy chain, dropped"
              : !reached("hback")
                ? "The retry, with the answer as a hint"
                : rescued
                  ? "The hinted chain, as it would be trained on"
                  : "The hinted chain, dropped"}
          </Step>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-canvas p-3">
            <div className="flex max-w-[95%] items-start gap-2 self-end">
              {/* The question scrolls past a few lines; the hint sits outside it so it is never cut off. */}
              <div className="flex flex-col items-end gap-1">
                <p className="max-h-32 overflow-y-auto whitespace-pre-wrap text-right font-code text-sm text-ink">
                  {tidyMath(problem.question)}
                </p>
                {hinted ? (
                  <mark
                    className={`rounded px-1 text-right font-code text-sm text-ink transition-all duration-500 ${
                      on("hint") ? "scale-105 bg-compute/50 ring-4 ring-compute/40" : "bg-compute/25"
                    }`}
                  >
                    (Hint: the correct answer is {tidyMath(problem.ground_truth)}.)
                  </mark>
                ) : null}
              </div>
              <UserIcon />
            </div>
            <div className="flex max-w-[95%] items-start gap-2 self-start">
              <ModelIcon />
              <div className="flex min-w-0 flex-col gap-2">
                {replyText === null ? (
                  <p className="flex items-center gap-2 text-sm text-ink-muted">
                    <span aria-hidden="true" className="animate-pulse text-compute-ink">▍</span>
                    {bi === "empty" ? "press Play to see its reply" : "the model tries again, told the answer"}
                  </p>
                ) : (
                  <>
                    <p
                      ref={replyBox}
                      className={`max-h-56 overflow-y-auto whitespace-pre-wrap break-words font-code text-sm leading-relaxed text-ink transition-opacity duration-500 ${
                        on("drop") ? "opacity-40" : ""
                      }`}
                    >
                      {tidyMath(replyText)}
                    </p>
                    {/* The model's answer, and the place the key lands beside it. */}
                    <div className="flex flex-nowrap items-center gap-1.5 text-sm" role="group" aria-label={`the model answered ${tidyMath(modelAnswer || "nothing")}`}>
                      <span
                        className={`inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 transition-all duration-500 ${
                          modelLit ? "border-compute bg-compute/30 ring-4 ring-compute/30" : "border-ink-muted/40 bg-surface-raised"
                        }`}
                      >
                        <span className="text-[10px] text-ink-muted">model</span>
                        <span className="font-mono font-semibold text-ink">{tidyMath(modelAnswer || "none")}</span>
                      </span>
                      <span
                        className={`font-mono font-bold transition-opacity duration-300 ${matched ? "text-correct-ink" : "text-wrong-ink"} ${
                          on("cmp", "hcmp", "back", "hback") ? "text-xl opacity-100" : checked ? "text-sm opacity-100" : "opacity-0"
                        }`}
                      >
                        {!checked ? (matched ? "==" : "!=") : matched ? "== the key ✓" : "!= the key ✗"}
                      </span>
                      {/* Where the key lands; the key itself is the copy in flight, so this stays invisible. */}
                      <span ref={keyLanding} className={`invisible ${checked ? "absolute" : ""}`}>
                        <KeyChip answer={problem.ground_truth} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The copy in flight: the key going over or coming back, or the reasoning going into the training set. */}
      {flight ? (
        <Flyer key={flight.id} from={flight.from} to={flight.to} ms={flight.ms}>
          {flight.kind === "key" ? (
            <KeyChip answer={problem.ground_truth} lit />
          ) : kept ? (
            <ExampleCard question={problem.question} reasoning={kept.trace} answer={problem.ground_truth} hinted={kept.hinted} />
          ) : null}
        </Flyer>
      ) : null}

      {/* Play and Reset, as on page 5. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={play}
          disabled={bi !== "empty"}
          className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={bi === "empty"}
          className="ml-auto rounded bg-wrong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ↺ Reset
        </button>
      </div>

      {/* The same pass over every problem. */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-ink-muted">
          Run the same pass on all {n} problems. How many put reasoning into the training set?
        </p>
        <div
          role="img"
          aria-label={`${inSet} of ${n} problems put reasoning into the training set${rationalize ? `, ${HINT_RESCUED} of them through rationalization` : ""}, none with a wrong answer`}
          className="flex flex-col gap-0.5"
        >
          <div className="flex h-4 w-full overflow-hidden rounded-sm bg-surface-raised">
            <span className="h-full bg-correct transition-[width]" style={{ width: pct(GREEDY_RIGHT) }} />
            <span className="h-full bg-compute transition-[width]" style={{ width: pct(rationalize ? HINT_RESCUED : 0) }} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-mono text-[11px] tabular-nums text-ink-muted">
            <span className="text-ink">{inSet} of {n} problems, none with a wrong answer</span>
            <span className="flex items-center gap-1"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-correct" /> {GREEDY_RIGHT} greedy chain right</span>
            {rationalize ? <span className="flex items-center gap-1"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-compute" /> {HINT_RESCUED} rescued by the hint</span> : null}
            <span className="flex items-center gap-1"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-sm bg-surface-raised" /> nothing kept</span>
          </div>
        </div>
      </div>

      <figcaption className="border-t border-dashed border-grid pt-2 text-xs text-ink-muted">
        This is the data one round of STaR would fine-tune on; nothing here is trained. Sampling{" "}
        {PAGE12.n_chains} chains per problem instead of one greedy chain, the RFT variant,
        <Cite n={REF.rft} /> reaches {PAGE12.curves.key[PAGE12.n_chains - 1].problems_with_lesson} problems
        without a hint, but more samples also reach more right answers through wrong reasoning, which
        is why STaR decodes greedily.
        <Cite n={REF.star} />
      </figcaption>
    </figure>
  );
}

/** Small eyebrow over each exchange. */
function Step({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{children}</p>;
}


export function Page12() {
  const page = getPage(PAGE_N)!;
  const paper = curves.starCqa;
  const p = paper.fit!.params;


  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        A model writes its own reasoning, an answer key discards what&apos;s wrong, and the
        survivors become its next training set.{" "}
        <strong className="text-ink">What happens when you take the answer key away?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Section 1 — the loop, run by hand */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Run the loop</h2>

          <p className="text-ink">
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

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            {/* the loop itself, with the rationalization branch, signal animated to turn */}
            <StarLoop filter />

            <p className="text-ink">
              This is <strong>STaR</strong>&apos;s loop.
              <Cite n={REF.star} /> It still needs a dataset, questions <em>with correct
              answers</em>, but nobody has to write the reasoning; the model authors that itself.
              Everything rests on the answer key: the correctness check that decides which rationales
              are allowed to train, and the external signal deciding what the model may study.
            </p>
          </div>

          {/* the loop written down — merged in from the former section 2 */}
          <h3 className="mt-2 text-lg font-semibold text-ink">Algorithm</h3>

          <p className="text-ink">The same loop from section 1, in ten lines.</p>

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
              The ten lines above are STaR&apos;s Algorithm 1, condensed.
              <Cite n={REF.star} /> Line 2&apos;s loop is not just similar to reinforcement learning:
              it is the same procedure, <em>expert iteration</em>, from five years before LLM
              reasoning.
              <Cite n={REF.exit} /> Line 5 makes one attempt per problem; the <em>RFT</em> variant
              samples several instead and keeps the ones that reach the right answer.
              <Cite n={REF.rft} />
            </figcaption>
          </figure>
        </section>

        {/* Merged section 1's margin: every reference it uses. */}
        <div className="flex flex-col gap-6 lg:gap-0">
          <Note kicker="References">
            <RefItem n={REF.star} href="https://arxiv.org/abs/2203.14465">
              Zelikman et al. 2022, <em>STaR: Bootstrapping Reasoning With Reasoning</em>, NeurIPS
              2022.
            </RefItem>
            <RefItem n={REF.exit} href="https://arxiv.org/abs/1705.08439">
              Anthony, Tian &amp; Barber 2017, <em>Thinking Fast and Slow with Deep Learning and
              Tree Search</em>, NeurIPS 2017.
            </RefItem>
            <RefItem n={REF.rft} href="https://arxiv.org/abs/2308.01825">
              Yuan et al. 2023, <em>Scaling Relationship on Learning Mathematical Reasoning with
              Large Language Models</em>.
            </RefItem>
          </Note>
        </div>

        {/* Section 2: STaR's filter run over page 7's pile */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h2 className="text-xl font-semibold text-ink">
              2. Which reasoning goes into the training set?
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                measured · {modelLabel} · {PAGE12.manifest.n_items} MATH-500 problems
              </span>
            </h2>
            <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
          </div>
          <p className="text-ink">
            To understand how reasoning is selected for the training set, let&apos;s look at how STaR could
            work with {modelLabel} on {walked.length} problems pulled from the MATH-500 dataset, below. We
            won&apos;t be showing the training itself; rather, we will focus on how the reasoning is
            selected for training in the first place.
          </p>
          <p className="text-ink">
            Press <strong className="text-ink">Play</strong> to watch one pass of STaR, use the arrows to
            flip through all {walked.length} problems, and press <strong className="text-ink">Reset</strong>{" "}
            to run a problem again. Notice that when the model&apos;s answer does not match the answer key,
            the model still gets another chance, through{" "}
            <strong className="text-ink">rationalization</strong>. The model is re-prompted with the answer
            as a hint, and as long as it produces reasoning that leads to the correct answer, that
            reasoning trace is still stored. Turn rationalization off and play the last three problems
            again: the model gets no second chances.
          </p>
          <StarHarvest />
          {PAGE12.hint ? (
            <p className="text-ink">
              <strong className="text-ink">Why keep reasoning that was given the answer?</strong> It might
              look like cheating, but the answer was never what we wanted the model to learn; the answer key
              already has it. What we want is the reasoning that gets there. When the model reaches the
              correct answer with the help of a hint, that reasoning is still useful training data, and the
              hint is removed before it is stored. There is a catch. The answer key only checks the final
              answer, not the steps in between. Of the {PAGE12.hint.recovered.length} problems
              rationalization recovered here, {PAGE12.hint.mentions_hint.length} of the reasoning traces
              refer to the hint directly, and STaR keeps those too. In the original paper, rationalization
              raised GPT-J&apos;s accuracy on CommonsenseQA from {p.starNoRationalization}% to {p.star}%.
              <Cite n={REF.star} />
            </p>
          ) : null}
          <p className="text-ink">
            <strong className="text-ink">Training data without a human in the loop.</strong> Nobody wrote a
            worked solution for any of these problems. Every reasoning trace in the training set was written
            by the model and checked only against the final answer. One greedy pass gave{" "}
            {PAGE12.greedy_lessons} of the {PAGE12.manifest.n_items} problems reasoning for the training set
            {PAGE12.hint ? <>, and rationalization added {PAGE12.hint.recovered.length} more</> : null}, with
            no wrong answers among them. The answer key also catches what voting misses: on page 7, majority
            voting over {PAGE12.n_chains} chains got {PAGE12.vote_missed.length} problems wrong even though at
            least one chain had found the right answer, and any of those chains could be kept here. We
            don&apos;t train on this set, so we can&apos;t show how much it would improve Qwen. In the STaR
            paper, repeating this loop took GPT-J from {p.fewShotCot}% with few-shot chain of thought to{" "}
            {p.star}% on CommonsenseQA.
            <Cite n={REF.star} />
          </p>
        </section>

        {/* Beside the chart, and kept beside it as the reader scrolls through it. */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Note kicker="Rationalization">
            <p>A missed problem is retried once with the answer as a hint.</p>
          </Note>
        </div>

        {/* The two closing blocks — kept at the page bottom on purpose, reading
            over both the listing and the results above them. */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <p className="text-ink">
            <strong className="text-ink">Trained on reasoning, graded on answers.</strong> The
            rationale enters the weights, but only the answer key decides whether it gets there, so
            a flawed argument that lands correctly isn&apos;t just kept, it&apos;s imitated.
            <Cite n={REF.star} /> That is not hypothetical: models often follow a wrong reasoning
            path to the right answer.
            <Cite n={REF.gvm} /> Page 9&apos;s outcome-versus-process trade, now deciding what the
            model becomes.
          </p>

          <Handoff>
            <p>
              <strong className="text-ink">There are now two ways to buy reasoning:</strong> spend
              the compute when the question arrives, or spend it long before, building the reasoning
              into the model.
            </p>
            <ul className="list-disc space-y-1.5 pl-5 marker:text-ink-muted">
              <li>
                <strong className="text-ink">Spend at answer time.</strong> All of Act 2 spends the
                compute after the question lands (show the road, cap the tokens, sample and vote,
                score and re-rank, search the tree) and page 11 priced that shelf against
                parameters.
              </li>
              <li>
                <strong className="text-ink">Spend at training time.</strong> This page is the other
                way: it spends long before the question exists, the first knob that lifts the curve
                without buying a single parameter.
              </li>
            </ul>
            <p>
              o1 and R1 keep this loop&apos;s shape and drop the disguise, so the filter becomes an
              explicit RL reward on checkable tasks and the model&apos;s own sampling becomes the
              training set. Next comes the frontier, where one lab turns both kinds of spending at
              once and bills you for each. <em>Page 13 picks it up from there.</em>
            </p>
          </Handoff>
        </div>

        <Note kicker="References">
          <RefItem n={REF.gvm} href="https://arxiv.org/abs/2505.02391">
            Yao et al. 2025, <em>Optimizing Chain-of-Thought Reasoners via Gradient Variance
            Minimization in Rejection Sampling and RL</em>.
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
