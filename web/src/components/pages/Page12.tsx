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

import { useEffect, useRef, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { NotebookDownload } from "@/components/NotebookDownload";
import { Slider } from "@/components/Slider";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { STAR_LINES } from "@/lib/starListing";
import { ModelIcon, UserIcon } from "@/components/ChatIcons";
import {
  PAGE12,
  cellState,
  harvest,
  hasHint,
  modelLabel,
  shownChain,
  tidyMath,
  type CellState,
  type Chain,
  type Problem,
  type Rule,
} from "@/lib/page12";

const PAGE_N = 12;
const N_CHAINS = PAGE12.n_chains;

/** Section 2's run: the notebook, page 7's chains it replays, page 9's step scores, and the hint retry. */
const NOTEBOOK_ZIP = "/notebooks/page-12-star-harvest.zip";
const NOTEBOOK_SIZE = "4.9 MB";

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
 * Section 2's figure: STaR's training set built from page 7's pile, nothing trained. One
 * square per problem, ordered by how many of its chains were right so the grid fills from
 * the left as chains are added. Each control is one line of the listing above: the slider
 * is how many chains line 5 writes, the rule is line 6's check, and the hint toggle is
 * lines 8 and 9. Only the answer key is STaR's check; majority vote and page 9's step
 * grader are answer-time selectors put to a training-time job, there for contrast. Every number shown is recomputed from the bundled verdicts, which the
 * load step has already checked against the notebook.
 */
const STATE_STYLE: Record<CellState, string> = {
  right: "border-correct bg-correct",
  wrong: "border-wrong bg-wrong",
  hint: "border-compute bg-compute",
  none: "border-grid bg-transparent",
};

const STATE_LABEL: Record<CellState, string> = {
  right: "trains on a correct answer",
  wrong: "trains on a wrong answer",
  hint: "trains on a correct answer found with a hint",
  none: "no training data",
};

function StarHarvest() {
  const N = PAGE12.n_chains;
  const [k, setK] = useState(1);
  const [rule, setRule] = useState<Rule>("key");
  const [useHint, setUseHint] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const hintOn = useHint && rule === "key";

  const cells = PAGE12.order.map((p) => {
    const kept = harvest(p, k, rule);
    return { p, kept, state: cellState(p, k, rule, hintOn) };
  });
  const inSet = cells.filter((c) => c.state !== "none").length;
  const chainsIn = cells.reduce((s, c) => s + c.kept.length + (c.state === "hint" ? 1 : 0), 0);
  const chainsWrong = cells.reduce((s, c) => s + c.kept.filter((j) => !c.p.correct[j]).length, 0);
  const open = cells.find((c) => c.p.problem_id === openId) ?? null;
  const shown: CellState[] = rule === "key" ? (hintOn ? ["right", "hint", "none"] : ["right", "none"]) : ["right", "wrong", "none"];

  const RULES: { id: Rule; label: string }[] = [
    { id: "key", label: "Only chains with the correct answer (STaR)" },
    { id: "popular", label: "Chains that agree with the majority (no answer key)" },
    { id: "prm", label: "Chains whose every step a step grader passes (no answer key)" },
  ];

  return (
    <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span id="star-rule" className="text-sm text-ink-muted">
            Which chains go into the training set?
          </span>
          <div role="radiogroup" aria-labelledby="star-rule" className="grid gap-1 sm:grid-cols-3">
            {RULES.map((r) => (
              <button
                key={r.id}
                type="button"
                role="radio"
                aria-checked={rule === r.id}
                onClick={() => setRule(r.id)}
                className={`h-12 rounded border px-2 text-xs leading-tight ${
                  rule === r.id
                    ? "border-compute bg-compute/15 text-ink"
                    : "border-grid text-ink-muted hover:border-compute hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <Slider
          label="Reasoning chains written per problem"
          min={1}
          max={N}
          value={k}
          onChange={setK}
          ticks={[1, 4, 8, 12, 16]}
        />
      </div>

      {hasHint && rule === "key" ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={useHint} onChange={(e) => setUseHint(e.target.checked)} />
          When no chain is correct, retry once with the correct answer given as a hint (lines 8 and 9)
        </label>
      ) : null}

      <div
        role="img"
        aria-label={`${PAGE12.manifest.n_items} problems at ${k} chains each: ${inSet} put training data in, and ${chainsWrong} of the ${chainsIn} chains in the training set have a wrong answer.`}
        className="grid grid-cols-10 gap-1 sm:grid-cols-[repeat(20,minmax(0,1fr))]"
      >
        {cells.map(({ p, state }) => {
          const isOpen = p.problem_id === openId;
          return (
            <button
              key={p.problem_id}
              type="button"
              data-problem={p.problem_id}
              aria-label={`${p.subject}, level ${p.level}: ${STATE_LABEL[state]}`}
              aria-pressed={isOpen}
              onClick={() => setOpenId(isOpen ? null : p.problem_id)}
              className={`aspect-square rounded-sm border transition-colors ${STATE_STYLE[state]} ${
                isOpen ? "outline outline-2 outline-offset-2 outline-ink" : ""
              }`}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        <span>One square per problem.</span>
        {shown.map((st) => (
          <span key={st} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm border ${STATE_STYLE[st]}`} />
            {STATE_LABEL[st]}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "problems in the training set", value: `${inSet} of ${PAGE12.manifest.n_items}` },
          { label: "chains in the training set", value: String(chainsIn) },
          { label: "of those, wrong answers", value: String(chainsWrong), bad: chainsWrong > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded bg-surface-raised px-3 py-2">
            <dt className="text-xs text-ink-muted">{s.label}</dt>
            <dd className={`m-0 font-mono text-base tabular-nums sm:text-xl ${s.bad ? "text-wrong-ink" : "text-ink"}`}>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>

      {open ? (
        <OpenProblem problem={open.p} kept={open.kept} state={open.state} k={k} rule={rule} />
      ) : (
        <p className="text-sm text-ink-muted">Click a square to see the problem and what the model wrote for it.</p>
      )}

      <figcaption className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
        This is the data one round of STaR would fine-tune on; nothing here is trained. With the
        answer key no wrong answer gets in, and writing more chains per problem puts more problems
        in: {PAGE12.curves.key[0].problems_with_lesson} at one chain, {PAGE12.curves.key[N - 1].problems_with_lesson}{" "}
        at {N}. STaR writes one chain per problem; writing several is the RFT variant.
        <Cite n={REF.rft} /> Without the key, keeping whatever the majority answered puts{" "}
        {PAGE12.curves.popular[N - 1].chains_wrong} wrong answers among {PAGE12.curves.popular[N - 1].chains_kept}{" "}
        chains at {N}, and the model would be trained to reason its way to them. The step grader is
        page 9&apos;s process reward model, {PAGE12.prm.model_id.split("/").pop()}, at page 9&apos;s
        cutoff of {PAGE12.prm.threshold.toFixed(2)}; it never sees the answer key.
      </figcaption>
    </figure>
  );
}

/** The verdict under a model turn, in page 5's style. */
function Verdict({ correct, answer, groundTruth }: { correct: boolean; answer: string; groundTruth: string }) {
  return (
    <p className={`rounded border-l-4 px-3 py-2 ${correct ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"}`}>
      <span className={`font-semibold ${correct ? "text-correct-ink" : "text-wrong-ink"}`}>
        {correct ? "✓" : "✗"} Final answer: {tidyMath(answer || "none")}.
      </span>
      {correct ? null : (
        <span className="text-sm text-ink-muted"> The answer key says {tidyMath(groundTruth)}.</span>
      )}
    </p>
  );
}

/** One exchange, set like page 5's chat: the user on the right, the model on the left. */
/**
 * A chain's text with page 9's flagged steps marked. Spans are character offsets into the
 * trace, so the text between them (the paragraph breaks) is the trace's own.
 */
function GradedReply({ trace, steps }: { trace: string; steps: Chain["steps"] }) {
  if (!steps) return <>{tidyMath(trace)}</>;
  // tidyMath trims, which would run one step into the next; keep the edges' own whitespace.
  const tidy = (t: string) => {
    const [, lead, body, trail] = t.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
    return lead + tidyMath(body) + trail;
  };
  const parts: React.ReactNode[] = [];
  let pos = 0;
  steps.forEach(([a, b, score], i) => {
    if (a > pos) parts.push(tidy(trace.slice(pos, a)));
    const text = tidy(trace.slice(a, b));
    parts.push(
      score < PAGE12.prm.threshold ? (
        <mark key={i} className="rounded bg-wrong/20 text-ink" title={`step grader: ${score.toFixed(2)}`}>
          {text}
          <span className="ml-1 rounded bg-wrong/30 px-1 font-mono text-xs text-wrong-ink">
            step {i + 1} · {score.toFixed(2)}
          </span>
        </mark>
      ) : (
        text
      ),
    );
    pos = b;
  });
  if (pos < trace.length) parts.push(tidy(trace.slice(pos)));
  return <>{parts}</>;
}

/** What page 9's step grader made of a chain, under its answer verdict. */
function GraderVerdict({ chain }: { chain: Chain }) {
  const steps = chain.steps;
  const flagged = steps ? steps.filter((s) => s[2] < PAGE12.prm.threshold).length : 0;
  return (
    <p className="text-sm text-ink-muted">
      <span className="font-semibold text-ink">Step grader:</span>{" "}
      {!steps
        ? "not graded; the chain ran into its length cap, so it never passes."
        : flagged === 0
          ? `passes all ${steps.length} steps.`
          : `flags ${flagged} of ${steps.length} steps, marked above, so it does not pass.`}
    </p>
  );
}

function Exchange({ prompt, hintText, reply, steps, verdict }: {
  prompt: string;
  hintText?: string;
  reply: string;
  steps?: Chain["steps"];
  verdict: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-grid bg-canvas p-3">
      <div className="flex max-w-[95%] items-start gap-2 self-end">
        <p className="whitespace-pre-wrap text-right font-code text-sm text-ink">
          {tidyMath(prompt)}
          {hintText ? (
            <>
              {"\n\n"}
              <mark className="rounded bg-compute/25 px-1 text-ink">{hintText}</mark>
            </>
          ) : null}
        </p>
        <UserIcon />
      </div>
      <div className="flex max-w-[95%] items-start gap-2 self-start">
        <ModelIcon />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words font-code text-sm leading-relaxed text-ink">
            {steps === undefined ? tidyMath(reply) : <GradedReply trace={reply} steps={steps} />}
          </p>
          {verdict}
        </div>
      </div>
    </div>
  );
}

/** Small eyebrow over each exchange. */
function Step({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{children}</p>;
}

/** What the model wrote for one problem, and what of it goes into the training set. */
function OpenProblem({ problem, kept, state, k, rule }: {
  problem: Problem;
  kept: number[];
  state: CellState;
  k: number;
  rule: Rule;
}) {
  const nRight = problem.correct.filter(Boolean).length;
  const first = problem.chains["0"];
  const shownIdx = shownChain(problem, kept);
  const keptChain = shownIdx === undefined ? null : problem.chains[String(shownIdx)];
  const verdictOf = (c: { correct: boolean; answer: string }) => (
    <Verdict correct={c.correct} answer={c.answer} groundTruth={problem.ground_truth} />
  );
  const chainVerdict = (c: Chain) => (
    <>
      {verdictOf({ correct: c.correct, answer: c.extracted_answer })}
      <GraderVerdict chain={c} />
    </>
  );
  const failed =
    rule === "key"
      ? k === 1 ? ", wrong" : `, all ${k} wrong`
      : rule === "prm"
        ? k === 1 ? ", which the step grader does not pass" : `; the step grader passes none of the ${k}`
        : k === 1 ? "" : `; the ${k} chains tie on their answers`;
  const inSet = state !== "none";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-xs text-ink-muted">
          {problem.subject}, level {problem.level} · the answer key says {tidyMath(problem.ground_truth)} · {nRight} of{" "}
          {problem.correct.length} chains reached it
        </p>
        <span
          className={`rounded border px-2 py-0.5 text-xs ${
            !inSet ? "border-grid text-ink-muted" : state === "wrong" ? "border-wrong text-wrong-ink" : "border-correct text-correct-ink"
          }`}
        >
          {inSet ? "goes into the training set" : "nothing goes into the training set"}
        </span>
      </div>

      {keptChain ? (
        <>
          <Step>
            Chain {shownIdx! + 1} of {k}
            {kept.length > 1 ? `, one of ${kept.length} kept` : ""}
            {kept.length > 1 && !keptChain.correct ? " (the first with a wrong answer)" : ""}
          </Step>
          <Exchange
            prompt={problem.question}
            reply={keptChain.trace}
            steps={keptChain.steps}
            verdict={chainVerdict(keptChain)}
          />
        </>
      ) : (
        <>
          <Step>
            {k === 1 ? "The one chain" : `Chain 1 of ${k}`}
            {failed}
          </Step>
          <Exchange prompt={problem.question} reply={first.trace} steps={first.steps} verdict={chainVerdict(first)} />
        </>
      )}

      {state === "hint" && problem.hint ? (
        <>
          <Step>The retry, with the answer given as a hint</Step>
          <Exchange
            prompt={problem.question}
            hintText={`(Hint: the correct answer is ${tidyMath(problem.ground_truth)}.)`}
            reply={problem.hint.trace}
            verdict={verdictOf(problem.hint)}
          />
          <p className="rounded border-l-4 border-compute bg-compute/10 px-3 py-2 text-sm text-ink">
            <strong>What goes into the training set:</strong> the question without the hint, paired with
            the reasoning above, as if the model had found it unaided.
            {problem.hint.mentions_hint
              ? " This reasoning refers to the hint, so with the hint deleted it argues from an answer it was never shown."
              : ""}
          </p>
        </>
      ) : null}
    </div>
  );
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
            STaR can be tried without training anything, because its first step is just asking. Here{" "}
            {modelLabel} was given each of {PAGE12.manifest.n_items} hard MATH problems and wrote up to{" "}
            {PAGE12.n_chains} reasoning chains for each, and every chain was checked against the answer
            key. The figure builds the training set one round of STaR would fine-tune on.
          </p>
          <StarHarvest />
          <p className="text-ink">
            <strong className="text-ink">The answer key finds what majority vote misses.</strong> On{" "}
            {PAGE12.vote_missed.length} problems at least one of the {PAGE12.n_chains} chains was correct,
            but the majority answer was wrong. Picking an answer at the moment of asking, with no key,
            loses that chain. Building a training set with the key keeps it.
          </p>
          <p className="text-ink">
            <strong className="text-ink">A step grader checks the reasoning, and is wrong both ways.</strong>{" "}
            The third rule ignores the answer and keeps a chain when page 9&apos;s process reward model
            passes every step. It refuses {PAGE12.prm.right_rejected} of the {PAGE12.prm.right_total}{" "}
            chains that reached the correct answer. Page 9 found that it catches most false steps but also
            flags sound ones, so some of these are flaws the answer key let through and some are false
            alarms; nothing here says which. On {PAGE12.prm.lost.length} problems it keeps no correct chain
            at all.
            And it passes {PAGE12.curves.prm[N_CHAINS - 1].chains_wrong} chains with wrong answers, on{" "}
            {PAGE12.prm.never_passed.length} of the {PAGE12.never.length} problems nothing solved. Majority
            vote and the step grader were built to pick an answer at the moment of asking (pages 7 and 9);
            here they do a different job, choosing what to train on. STaR uses the answer key because
            that check cannot be talked into a wrong answer, even though it cannot see the reasoning.
          </p>
          {PAGE12.hint ? (
            <p className="text-ink">
              <strong className="text-ink">The hint retry reaches the problems no chain solves.</strong>{" "}
              Of the {PAGE12.never.length} problems where all {PAGE12.n_chains} chains were wrong, the
              retry recovers {PAGE12.hint.recovered_never.length}. But a hint can carry an argument that
              does not hold: of the {PAGE12.hint.recovered.length} problems the model's single greedy try
              missed and the retry recovered, {PAGE12.hint.mentions_hint.length} reason by pointing at the
              hint, and STaR keeps them anyway once the answer matches. On CommonsenseQA the retry lifted
              GPT-J from {p.starNoRationalization}% to {p.star}%.
              <Cite n={REF.star} />
            </p>
          ) : null}
        </section>

        <Note kicker="Try it">
          <p>Write {PAGE12.n_chains} chains per problem, then switch to the majority rule and the step grader.</p>
        </Note>

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
