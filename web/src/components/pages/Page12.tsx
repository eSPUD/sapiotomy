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

import { useEffect, useRef } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { STAR_LINES } from "@/lib/starListing";

const PAGE_N = 12;

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

export function Page12() {
  const page = getPage(PAGE_N)!;
  const paper = curves.starCqa;
  const p = paper.fit!.params;

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
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="text-lg text-ink-muted">
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
            <RefItem n={REF.rft} href="https://arxiv.org/abs/2308.01825" preprint>
              Yuan et al. 2023, <em>Scaling Relationship on Learning Mathematical Reasoning with
              Large Language Models</em>.
            </RefItem>
          </Note>
        </div>

        {/* Section 2 (was 3) — the paper's result */}
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
              role="img"
              aria-label={`CommonsenseQA accuracy: GPT-J few-shot direct ${p.fewShotDirect} percent, GPT-J few-shot chain of thought ${p.fewShotCot} percent, LaMDA 137B few-shot chain of thought ${p.fewShotCotLamda} percent, GPT-J fine-tuned on human answers ${p.gptjFinetuned} percent, STaR without rationalization ${p.starNoRationalization} percent, STaR ${p.star} percent, GPT-3 thirty times larger fine-tuned ${p.gpt3Finetuned} percent.`}
            >
              {/* label takes a third, the plot two thirds; rows are equidistant */}
              <div className="relative">
                {/* one continuous x-grid: vertical lines every 20%, spanning all
                    rows, over just the plot column (offset past the label third) */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-0"
                  style={{ left: "calc(33.333% + 0.75rem)" }}
                >
                  {[0, 20, 40, 60, 80, 100].map((t) => (
                    <div key={t} className="absolute inset-y-0 w-px bg-grid" style={{ left: `${t}%` }} />
                  ))}
                </div>
                <div className="relative flex flex-col gap-1.5">
                  {bars.map((b) => (
                    <div key={b.label} className="flex min-h-[3.6rem] items-center gap-3 text-sm">
                      <span className="w-1/3 shrink-0 text-ink-muted">
                        {b.label}
                        <span className="block text-xs text-ink-muted">{b.note}</span>
                      </span>
                      <div className="relative flex-1">
                        {/* the bar sits on the grid; no opaque track hides the lines */}
                        <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                        {/* value, right-aligned on the plot */}
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-xs tabular-nums text-ink">
                          {b.value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* x-axis ticks and label, aligned under the plot column */}
              <div aria-hidden="true" className="mt-1.5 flex gap-3 text-[10px] text-ink-muted">
                <div className="w-1/3 shrink-0" />
                <div className="relative h-4 flex-1">
                  {[0, 20, 40, 60, 80, 100].map((t) => (
                    <span key={t} className="absolute -translate-x-1/2" style={{ left: `${t}%` }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div aria-hidden="true" className="flex gap-3">
                <div className="w-1/3 shrink-0" />
                <p className="flex-1 text-center text-[11px] text-ink-muted">
                  accuracy on CommonsenseQA (%)
                </p>
              </div>
            </div>
            <figcaption className="text-sm text-ink-muted">
              GPT-J has 6B parameters, and nobody wrote it a single worked solution. Fine-tuned on
              rationales it generated and filtered itself, it lands at{" "}
              <strong className="text-ink">{p.star}%</strong>, clear past the{" "}
              {p.fewShotCotLamda}% of a LaMDA <strong className="text-ink">23× its size</strong>{" "}
              prompted the same way, beside <strong className="text-ink">{p.gpt3Finetuned.toFixed(1)}%</strong>{" "}
              for a GPT-3 <strong className="text-ink">30× its size</strong> fine-tuned on the full
              human-labelled training set.
              <Cite n={REF.star} /> And the gap above the {p.gptjFinetuned}% answer-only
              fine-tune is the page&apos;s point. The value was never the answers, it was{" "}
              <em>training on the reasoning</em>.
            </figcaption>
          </figure>
        </section>

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

          <div className="flex flex-col gap-2 rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
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
          </div>
        </div>

        <Note kicker="References">
          <RefItem n={REF.gvm} href="https://arxiv.org/abs/2505.02391" preprint>
            Yao et al. 2025, <em>Optimizing Chain-of-Thought Reasoners via Gradient Variance
            Minimization in Rejection Sampling and RL</em>.
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
