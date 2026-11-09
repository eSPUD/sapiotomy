"use client";

/**
 * Page 8, "Best-of-N and Verifiers". Figure 1, the sister's-age demo, is an
 * illustration of the mechanism (generate, judge, keep the best) and says so.
 * Its chains and ratings are authored, live only in `SISTER`, and no number
 * from it may appear anywhere else on the page.
 *
 * Figures 2 and 3 and the close read `web/data/page-08-pile.json` through
 * `@/lib/page08Pile`: the temperature sweep's 100 problems and 16 chains each,
 * every chain scored by the trained verifier. Figure 4 reads
 * `web/data/page-08-judges.json`, a placeholder that says so on the figure.
 *
 * Whether Best-of-N and the vote differ is decided by the data, and the page
 * calls them level only while they are (Page8.test.tsx fails if that changes).
 * That comparison is ours: the source we build on never sets them against each
 * other, and the close says so.
 *
 * Provenance is a row of pills on each figure; there is no plate above them.
 * The margin holds references and nothing else.
 */

import { useEffect, useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { ModelIcon, UserIcon } from "@/components/ChatIcons";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { PILE8, pct } from "@/lib/page08Pile";
import { JUDGES8 } from "@/lib/page08Judges";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const NOTEBOOK_ZIP = "/notebooks/page-08-best-of-n.zip";
const NOTEBOOK_SIZE = "10.1 MB";

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  cobbe: 1,
  source: 2,
  stroebl: 3,
} as const;

/** "a, b and c", for a list of names read from the run rather than typed out. */
function andList(items: string[]): string {
  if (items.length < 2) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
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

/**
 * Provenance beside the figure it belongs to. One row of these replaces the
 * plate that used to sit under the lede: short enough to read without stopping,
 * and only on the figures that would otherwise leave the reader asking whether
 * a number was measured or made up.
 */
function Pills({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full border border-grid px-2 py-0.5 text-[11px] text-ink-muted"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * A legend as HTML rather than SVG text: it wraps, it inherits the page's type,
 * and a screen reader reads it as prose instead of as scattered <text> nodes.
 */
function Legend({ items }: { items: { cls: string; label: string; dashed?: boolean }[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[11px] text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <svg width={16} height={10} aria-hidden="true" className="shrink-0">
            {i.dashed ? (
              <line x1={0} x2={16} y1={5} y2={5} className={i.cls} strokeWidth={1.5} strokeDasharray="3 3" />
            ) : (
              <line x1={0} x2={16} y1={5} y2={5} className={i.cls} strokeWidth={2.5} />
            )}
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ figure 1 */

/** The judge, a third speaker beside page 5's user and model: a balance scale. */
function JudgeIcon({ current }: { current?: boolean }) {
  return (
    <span
      role="img"
      aria-label="Judge"
      title="Judge"
      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink motion-safe:transition-all motion-safe:duration-500 ${
        current ? "bg-compute ring-4 ring-compute/30" : "bg-ink/10"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M7 21h10M5 7h14" />
        <path d="M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z" />
      </svg>
    </span>
  );
}

const SISTER_QUESTION = "When I was 6, my sister was half my age. Now I'm 70. How old is my sister?";

/**
 * The sister's-age puzzle, as four chains of thought: two land on the tempting
 * 35 (halving 70, as if the ratio held), one on the right 67 (the three-year gap
 * holds), one strays to 64. Authored, not measured, and the figure says so.
 *
 * The judge is the kind the rest of the page measures: a second model trained
 * on solutions marked right or wrong. It reads the question and one whole chain
 * and returns one number, how likely that chain is right. It never sees the
 * answer key and gives no reasons, so the figure shows no checks: a line like
 * "at 6 she was 3, and 3 is half of 6" would show it checking the answer
 * against the question, which it does not do. One number per chain, never one
 * per step: grading steps is page 9's subject. Two chains with the same answer
 * can rate differently, because it reads the chain and not just the answer.
 */
const SISTER: { answer: string; rating: number; work: string[] }[] = [
  { answer: "35", rating: 18, work: ["half of 70 is 35", "so my sister is 35"] },
  { answer: "67", rating: 96, work: ["at 6, she was half my age: 3", "so she is 3 years younger", "70 − 3 = 67"] },
  { answer: "35", rating: 21, work: ["she is half my age", "70 ÷ 2 = 35"] },
  { answer: "64", rating: 9, work: ["the gap is 6 years", "70 − 6 = 64"] },
];

const SISTER_KEPT = SISTER.reduce((best, c, i) => (c.rating > SISTER[best].rating ? i : best), 0);

/** How long each chain takes to appear, and how long the judge spends on each one. */
const WRITE_MS = 450;
const READ_MS = 900;
/** The beat between judging the last chain and keeping the best. */
const PAUSE_MS = 600;

type Phase = "idle" | "generating" | "judging" | "done";

/** What the model's response box says while the demo runs. */
const STATUS: Record<Phase, string> = {
  idle: "Press Play.",
  generating: "Generating…",
  judging: "Judging…",
  done: "Best candidate selected",
};

/**
 * One step of the demo, tinted while it plays: page 12's mark for the step the
 * playback is on. Its icon carries the ring (`[&>span:first-child]`), so the
 * shared chat icons need no prop of their own.
 */
function Stage({ n, current, children }: { n: number; current: boolean; children: React.ReactNode }) {
  return (
    <div
      data-current={current ? `step-${n}` : undefined}
      className={`-mx-2 flex flex-col gap-2 rounded-lg p-2 motion-safe:transition-colors motion-safe:duration-500 ${
        current ? "bg-compute/10" : ""
      }`}
    >
      {children}
    </div>
  );
}

/** The ring a step's icon wears while the step plays. */
const iconRing = (current: boolean) =>
  `flex items-start gap-2 [&>span:first-child]:motion-safe:transition-shadow [&>span:first-child]:motion-safe:duration-500 ${
    current ? "[&>span:first-child]:ring-4 [&>span:first-child]:ring-compute/30" : ""
  }`;

/**
 * A small box in the judge's input → output strip. `lit` is page 12's mark for
 * the part of the figure doing the work right now: a solid compute border and
 * tint with a ring around it.
 */
function Slot({ children, strong, lit }: { children: React.ReactNode; strong?: boolean; lit?: boolean }) {
  return (
    <span
      className={`rounded border px-3 py-1.5 text-center text-xs motion-safe:transition-all motion-safe:duration-500 ${
        lit
          ? "border-compute bg-compute/30 text-ink ring-4 ring-compute/30"
          : strong
            ? "border-ink-muted text-ink"
            : "border-grid text-ink-muted"
      }`}
    >
      {children}
    </span>
  );
}

/**
 * Best-of-N in one press. Play writes the four chains one after another, sends
 * them through the judge one at a time, so the reader watches what goes in (the
 * question and one chain) and what comes out (one number), then keeps the
 * highest rating and throws the rest away. A status line in the model's box
 * names the step. No vote here: this figure is the mechanism, and the
 * comparison with page 7 belongs to the steps below.
 */
function BestOfNDemo() {
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [phase, setPhase] = useState<Phase>("idle");
  // Chains written so far, and chains the judge has rated so far; while judging,
  // chain `read` is the one being read.
  const [written, setWritten] = useState(0);
  const [read, setRead] = useState(0);
  const n = SISTER.length;

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    if (phase === "generating") {
      t = written < n
        ? setTimeout(() => setWritten((w) => w + 1), WRITE_MS)
        : setTimeout(() => setPhase("judging"), PAUSE_MS);
    } else if (phase === "judging") {
      t = read < n
        ? setTimeout(() => setRead((r) => r + 1), READ_MS)
        : setTimeout(() => setPhase("done"), PAUSE_MS);
    }
    return () => clearTimeout(t);
  }, [phase, written, read, n]);

  // The steps are the content, so they play for everyone. Reduced motion drops
  // only the decoration: the bars' slide and the pulsing cursor.
  const play = () => {
    setWritten(0);
    setRead(0);
    setPhase("generating");
    recordInteraction(PAGE_N);
  };
  const reset = () => {
    setPhase("idle");
    setWritten(0);
    setRead(0);
  };

  const generating = phase === "generating";
  const judging = phase === "judging";
  const running = generating || judging;
  const judged = phase === "judging" || phase === "done";
  const reading = phase === "judging" && read < n ? read : null;
  const rated = (i: number) => phase === "done" || i < read;
  const kept = phase === "done";
  const best = SISTER[SISTER_KEPT];

  return (
    <section
      aria-label="Four chains, judged"
      className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
    >
      <div className="flex max-w-[95%] items-start gap-2 self-end">
        <p className="text-right font-code text-sm text-ink">{SISTER_QUESTION}</p>
        <UserIcon />
      </div>

      <Stage n={1} current={generating}>
        <div className={iconRing(generating)}>
          <ModelIcon />
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">Step 1.</strong> The model answers the same question {n} times.
            Each answer is its own chain of thought, written without seeing the other {n - 1}.
          </p>
        </div>
      </Stage>

      <p
        aria-live="polite"
        className={`flex items-center gap-2 font-mono text-sm sm:pl-8 ${kept ? "text-correct-ink" : "text-ink-muted"}`}
      >
        {kept ? (
          <span aria-hidden="true">✓</span>
        ) : (
          <span aria-hidden="true" className="text-compute-ink motion-safe:animate-pulse">
            ▍
          </span>
        )}
        {STATUS[phase]}
      </p>

      {written > 0 ? (
        <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
          {SISTER.slice(0, written).map((c, i) => {
            const isKept = kept && i === SISTER_KEPT;
            return (
              <li
                key={i}
                className={`flex flex-col gap-2 rounded-lg p-3 motion-safe:transition-opacity ${
                  isKept
                    ? "border-2 border-correct bg-correct/10"
                    : reading === i
                      ? "border-2 border-compute bg-surface-raised"
                      : "border-2 border-transparent bg-surface-raised"
                } ${kept && !isKept ? "opacity-50" : ""}`}
              >
                <p className="text-xs text-ink-muted">chain {i + 1}</p>
                <div className="flex flex-col gap-0.5 font-code text-xs leading-relaxed text-ink-muted">
                  {c.work.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
                <p className="text-sm text-ink">
                  Final answer: <strong className="font-mono">{c.answer}</strong>
                </p>
                {judged ? (
                  <div className="flex items-center gap-2 border-t border-grid pt-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-grid">
                      <span
                        className="block h-full rounded-full bg-compute motion-safe:transition-[width] motion-safe:duration-500"
                        style={{ width: rated(i) ? `${c.rating}%` : "0%" }}
                      />
                    </span>
                    <span className="w-24 text-right font-mono text-xs tabular-nums text-ink">
                      {rated(i) ? `${c.rating}% right` : reading === i ? "reading…" : "not read yet"}
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}

      <Stage n={2} current={judging}>
        <div className="flex items-start gap-2">
          <JudgeIcon current={judging} />
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">Step 2.</strong> A judge, a second model, reads one chain at
            a time. Only the outcome is scored.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:pl-8">
          <Slot lit={reading !== null}>
            question
            <br />+ {reading !== null ? `chain ${reading + 1}` : "one chain"}
          </Slot>
          <span aria-hidden="true" className="text-ink-muted">→</span>
          <Slot strong lit={judging}>
            judge
            <br />
            <span className="text-[11px] text-ink-muted">trained on solutions marked right or wrong</span>
          </Slot>
          <span aria-hidden="true" className="text-ink-muted">→</span>
          <Slot lit={judging && read > 0}>
            how likely
            <br />
            it is right
            {phase === "judging" && read > 0 ? (
              <>
                : <span className="font-mono text-ink">{SISTER[read - 1].rating}%</span>
              </>
            ) : null}
          </Slot>
        </div>
      </Stage>

      <Stage n={3} current={kept}>
        <div className={iconRing(kept)}>
          <span
            aria-hidden="true"
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm text-ink motion-safe:transition-colors motion-safe:duration-500 ${
              kept ? "bg-compute" : "bg-ink/10"
            }`}
          >
            ✓
          </span>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">Step 3.</strong> Keep the chain the judge rates highest.
          </p>
        </div>
        {kept ? (
          <p aria-live="polite" className="text-sm text-ink sm:pl-8">
            Best of {n} keeps chain {SISTER_KEPT + 1}:{" "}
            <strong className="font-mono text-correct-ink">{best.answer}</strong>, the judge&apos;s
            highest rating. The other {n - 1} are thrown away.
          </p>
        ) : null}
      </Stage>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={play}
          disabled={running}
          className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ▶ Play
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={phase === "idle"}
          className="ml-auto rounded bg-wrong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
        >
          ↺ Reset
        </button>
      </div>
      {/* Every other figure on the page is measured, so this one says it is not. */}
      <p className="font-mono text-xs text-ink-muted">This is an illustrative example.</p>
    </section>
  );
}

/* ------------------------------------------------------- figure 2: the dots */

/** What Best-of-N got on one problem. */
type Outcome = "kept-right" | "kept-wrong" | "no-right";
const outcomeOf = (r: (typeof PILE8.rows)[number]): Outcome =>
  r.n_correct === 0 ? "no-right" : r.chains[0].c ? "kept-right" : "kept-wrong";
const OUTCOMES: { o: Outcome; label: string; bg: string; fill: string }[] = [
  { o: "kept-right", label: "kept chain right", bg: "bg-correct", fill: "fill-correct" },
  { o: "kept-wrong", label: "kept chain wrong, a right one was written", bg: "bg-wrong", fill: "fill-wrong" },
  { o: "no-right", label: "no right chain written", bg: "bg-grid", fill: "fill-grid" },
];
const OUTCOME_FILL = Object.fromEntries(OUTCOMES.map((x) => [x.o, x.fill])) as Record<Outcome, string>;

const DOT_W = 672;
const DOT_M = { top: 12, right: 12, bottom: 40, left: 12 };
/** The largest spacing between dots, and the tallest the stacks may grow. */
const DOT_PITCH = 17;
const DOT_MAX_H = 300;

/**
 * How the stacks fill their columns: the fewest dots side by side that keep the
 * tallest stack under `DOT_MAX_H`. A few dozen problems stack singly; hundreds
 * wrap into narrow blocks of smaller dots.
 */
function dotGrid(tallest: number, columnW: number) {
  for (let perRow = 1; ; perRow++) {
    const pitch = Math.min(DOT_PITCH, columnW / perRow);
    if (Math.ceil(tallest / perRow) * pitch <= DOT_MAX_H) return { perRow, pitch };
  }
}

/** The problems where the kept chain was wrong and exactly one chain was right. */
const MISSES_ONE_RIGHT = PILE8.rows.filter((r) => outcomeOf(r) === "kept-wrong" && r.n_correct === 1).length;

/**
 * Every problem as one dot, stacked over how many of its 16 chains are right
 * and coloured by what Best-of-N got: the kept chain right, the kept chain
 * wrong although a right one was written, or no right chain to keep.
 */
function ChainDots() {
  const rows = PILE8.rows;
  const n = PILE8.nChains;
  const cols = Array.from({ length: n + 1 }, (_, k) => rows.filter((r) => r.n_correct === k));
  const tallest = Math.max(...cols.map((c) => c.length));
  const innerW = DOT_W - DOT_M.left - DOT_M.right;
  const cw = innerW / (n + 1);
  const { perRow, pitch } = dotGrid(tallest, cw);
  const innerH = Math.ceil(tallest / perRow) * pitch;
  const height = DOT_M.top + DOT_M.bottom + innerH;
  const r = pitch * 0.41;
  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-ink-muted">
        {OUTCOMES.map((x) => (
          <li key={x.o} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-3 w-3 rounded-full ${x.bg}`} />
            {x.label}
          </li>
        ))}
      </ul>
      <ChartFrame
        width={DOT_W}
        height={height}
        margin={DOT_M}
        xLabel={`chains right, of ${n}`}
        title={
          `${rows.length} problems as dots, stacked over how many of their ${n} chains are right ` +
          `and coloured by whether the chain Best-of-N kept was right.`
        }
      >
        {cols.map((col, k) => (
          <g key={k}>
            {[...col]
              .sort((a, b) => +b.chains[0].c - +a.chains[0].c)
              .map((row, i) => (
                <circle
                  key={row.id}
                  data-outcome={outcomeOf(row)}
                  cx={k * cw + cw / 2 + ((i % perRow) - (perRow - 1) / 2) * pitch}
                  cy={innerH - pitch / 2 - Math.floor(i / perRow) * pitch}
                  r={r}
                  className={OUTCOME_FILL[outcomeOf(row)]}
                />
              ))}
            <text x={k * cw + cw / 2} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
              {k}
            </text>
          </g>
        ))}
      </ChartFrame>
    </div>
  );
}

/* -------------------------------------------------------- figure 3: the bars */

const CMP_W = 672;
const CMP_ROW = 46;
const CMP_M = { top: 34, right: 124, bottom: 38, left: 150 };

/**
 * The three methods on the same problems and the same chains, as horizontal
 * bars. The dashed line is the most any way of choosing could reach: a right
 * chain was among the 16. Past each choosing bar, the faint stretch up to that
 * line is what was written and not picked.
 */
function CompareFigure() {
  const b = PILE8.bars;
  const nProblems = PILE8.rows.length;
  const bars = [
    { label: "one chain of thought", v: b.one_chain, fill: "fill-ink-muted", text: "fill-ink" },
    { label: `majority vote over ${PILE8.nChains}`, v: b.vote, fill: "fill-compute", text: "fill-compute-ink" },
    { label: `Best-of-${PILE8.nChains}`, v: b.best_of_n, fill: "fill-correct", text: "fill-correct-ink" },
  ];
  const innerW = CMP_W - CMP_M.left - CMP_M.right;
  const innerH = bars.length * CMP_ROW;
  const height = CMP_M.top + CMP_M.bottom + innerH;
  const x = (v: number) => v * innerW;
  const solved = (v: number) => Math.round(v * nProblems);

  return (
    <ChartFrame
      width={CMP_W}
      height={height}
      margin={CMP_M}
      xLabel={`share of ${nProblems} problems solved`}
      title={
        `On the same ${nProblems} problems and the same chains, one chain of thought solves ` +
        `${pct(b.one_chain)}, majority voting over ${PILE8.nChains} solves ${pct(b.vote)} and ` +
        `Best-of-${PILE8.nChains} solves ${pct(b.best_of_n, 1)}. At least one chain was correct on ` +
        `${pct(b.ceiling, 1)}, the most any way of choosing could reach.`
      }
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t * 100}%
          </text>
        </g>
      ))}
      {bars.map((bar, i) => {
        const y = i * CMP_ROW + CMP_ROW / 2;
        return (
          <g key={bar.label}>
            <text x={-10} y={y + 4} textAnchor="end" className="fill-ink text-[12px]">
              {bar.label}
            </text>
            {i > 0 ? (
              <rect
                x={x(bar.v)}
                y={y - 11}
                width={x(b.ceiling) - x(bar.v)}
                height={22}
                className={bar.fill}
                opacity={0.18}
              />
            ) : null}
            <rect x={0} y={y - 11} width={x(bar.v)} height={22} className={bar.fill} />
            <text x={innerW + 10} y={y + 4} className={`text-[12px] font-semibold ${bar.text}`}>
              {pct(bar.v, bar.v * 100 % 1 ? 1 : 0)}
              <tspan className="fill-ink-muted font-normal"> · {solved(bar.v)} of {nProblems}</tspan>
            </text>
          </g>
        );
      })}
      <line
        x1={x(b.ceiling)}
        x2={x(b.ceiling)}
        y1={-14}
        y2={innerH}
        className="stroke-ink"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <text x={x(b.ceiling)} y={-20} textAnchor="middle" className="fill-ink text-[11px]">
        at least one chain was correct: {pct(b.ceiling, 1)}
      </text>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 4 */

const JB_W = 672;
const JB_ROW = 34;
const JB_M = { top: 12, right: 72, bottom: 38, left: 150 };

/**
 * Best-of-N once per judge: every judge picks from the same chains, so the only
 * thing that changes from bar to bar is the judge. A bar that clears the vote is
 * drawn in the Best-of-N colour; one that does not is grey. The three vertical
 * lines are one chain, the vote and the ceiling, named in the legend under it.
 */
function JudgeBarsFigure() {
  const J = JUDGES8;
  const innerW = JB_W - JB_M.left - JB_M.right;
  const innerH = J.judges.length * JB_ROW;
  const height = JB_M.top + JB_M.bottom + innerH;
  const x = (v: number) => v * innerW;
  const lines = [
    { v: J.oneChain, cls: "stroke-ink-muted", dash: undefined },
    { v: J.vote, cls: "stroke-compute", dash: "4 3" },
    { v: J.ceiling, cls: "stroke-ink", dash: "1 3" },
  ];
  return (
    <ChartFrame
      width={JB_W}
      height={height}
      margin={JB_M}
      xLabel={`share of ${J.nProblems} problems solved`}
      title={
        `Best-of-${J.nChains} with each of ${J.judges.length} judges picking from the same chains: ` +
        J.judges.map((j) => `${j.label} ${pct(j.best_of_n)}`).join(", ") +
        `. One chain solves ${pct(J.oneChain)}, majority voting ${pct(J.vote)}, and at least one ` +
        `chain was correct on ${pct(J.ceiling)}.`
      }
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t * 100}%
          </text>
        </g>
      ))}
      {J.judges.map((j, i) => {
        const y = i * JB_ROW + JB_ROW / 2;
        const beats = j.best_of_n > J.vote;
        return (
          <g key={j.id} data-beats-vote={beats}>
            <text x={-10} y={y - 1} textAnchor="end" className="fill-ink text-[12px]">
              {j.label}
            </text>
            <text x={-10} y={y + 11} textAnchor="end" className="fill-ink-muted text-[9px]">
              {j.kind}
            </text>
            <rect
              x={0}
              y={y - 9}
              width={x(j.best_of_n)}
              height={18}
              className={beats ? "fill-correct" : "fill-ink-muted"}
              opacity={beats ? 1 : 0.45}
            />
            <text x={innerW + 8} y={y + 4} className={`text-[12px] font-semibold ${beats ? "fill-correct-ink" : "fill-ink"}`}>
              {pct(j.best_of_n, Math.round(j.best_of_n * 1000) % 10 ? 1 : 0)}
            </text>
          </g>
        );
      })}
      {lines.map((l) => (
        <line
          key={l.cls}
          x1={x(l.v)}
          x2={x(l.v)}
          y1={-6}
          y2={innerH}
          className={l.cls}
          strokeWidth={1.5}
          strokeDasharray={l.dash}
        />
      ))}
    </ChartFrame>
  );
}

/* ---------------------------------------------------------------------- page */

export function Page8() {
  const page = getPage(PAGE_N)!;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>

      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        Chain of thought lets a model reason through a problem step by step. Majority voting samples
        many of those chains and keeps the answer that comes up most often. But what if, instead of
        counting answers, we checked each one against a clear standard and kept the best? That
        approach is called <strong className="text-ink">Best-of-N sampling</strong>.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — how Best-of-N works */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Generate, judge, keep the best</h2>
          <p className="text-ink">
            Best-of-N works in three steps: the model writes several chains of thought for the same
            question, a judge rates each chain on its own, and the chain with the highest rating is
            kept. Press Play to watch it on a small puzzle.
          </p>
          <BestOfNDemo />
          {/* The anchor sentence: the formal version of what the demo just showed,
              from Cobbe et al.'s abstract, cited in the margin beside it. */}
          <p className="text-ink">
            That is the whole method. In the words of the paper that introduced it, you{" "}
            &ldquo;generate many candidate solutions and select the one ranked highest by the
            verifier.&rdquo;
            <Cite n={REF.cobbe} /> The verifier is the judge: a second model, trained on solutions
            marked right or wrong.
          </p>
        </section>
        <Note kicker="References">
          <RefItem n={REF.cobbe} href="https://arxiv.org/abs/2110.14168">
            Cobbe et al. 2021, <em>Training Verifiers to Solve Math Word Problems</em> (arXiv
            2110.14168).
          </RefItem>
        </Note>

        {/* Step 2 — Best-of-N on the problems */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">2. Best-of-N on {PILE8.rows.length} problems</h2>
          <p className="text-ink-muted">
            The same method on {PILE8.rows.length} real problems. For each one the model wrote{" "}
            {PILE8.nChains} chains of thought, the judge rated every chain, and Best-of-N kept the one
            rated highest. Each dot below is one problem, placed by how many of its {PILE8.nChains}{" "}
            chains are right and coloured by whether the kept chain was right.
          </p>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            <Pills
              items={[
                "measured",
                PILE8.writer.split("/").pop() ?? PILE8.writer,
                `${PILE8.rows.length} ${PILE8.benchmark} problems, ${PILE8.nChains} chains each`,
              ]}
            />
            <ChainDots />
            <figcaption className="text-sm text-ink-muted">
              On {PILE8.bands.all} problems every chain is right, so any pick works. On{" "}
              {PILE8.bands.none} none is, so there is nothing for the judge to find. The judge matters
              in the {PILE8.bands.mixed} between: there the kept chain is right on{" "}
              <strong className="text-ink">{PILE8.bands.mixedKeptRight}</strong>. Of its{" "}
              {PILE8.bands.mixed - PILE8.bands.mixedKeptRight} misses, {MISSES_ONE_RIGHT} had only one
              right chain to find.
            </figcaption>
          </figure>
        </section>

        {/* Step 3 — the three methods side by side */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">
            3. Chain of thought, majority vote, Best-of-N
          </h2>
          <p className="text-ink-muted">
            Three ways to answer the same {PILE8.rows.length} problems from the same chains: take one
            chain of thought, take the answer most of the {PILE8.nChains} agree on, or take the chain
            the judge rates highest. Both ways of choosing need the chains to differ:
            with no randomness the model writes the same chain {PILE8.nChains} times, and there is
            nothing to count or to judge.
          </p>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            <Pills
              items={["measured", `${PILE8.rows.length} problems`, "all three read the same chains"]}
            />
            <CompareFigure />
            <figcaption className="text-sm text-ink-muted">
              Both ways of choosing beat one chain. Best-of-N fixes{" "}
              {PILE8.bars.best_vs_one.best_only} problems one chain got wrong and breaks{" "}
              {PILE8.bars.best_vs_one.one_only}; the vote fixes {PILE8.bars.vote_vs_one.vote_only} and
              breaks {PILE8.bars.vote_vs_one.one_only}. Against each other they are{" "}
              <strong className="text-ink">level</strong>: they disagree on only{" "}
              {PILE8.bars.best_vs_vote.best_only + PILE8.bars.best_vs_vote.vote_only} problems,{" "}
              {PILE8.bars.best_vs_vote.best_only} going to Best-of-N and{" "}
              {PILE8.bars.best_vs_vote.vote_only} to the vote, which is not a difference. And neither
              reaches the dashed line: the faint stretch past each bar is problems where a right chain
              was written and not picked.
            </figcaption>
          </figure>
          {/* The cost, in one sentence: nothing here is measured for it. */}
          <p className="text-ink-muted">
            Best-of-N costs what majority voting costs, {PILE8.nChains} chains, plus a second model
            that reads each of them once.
          </p>
        </section>

        {/* Step 4 — what a judge is worth. Pinned to the reading column: step 2
            has no margin note, so without it the grid flows this step into the
            margin. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">4. What a judge is worth</h2>
          <p className="text-ink-muted">
            Best-of-N is only as good as the judge that picks. Here {JUDGES8.judges.length} different
            judges read the same {JUDGES8.nChains} chains per problem, and each bar is how many
            problems Best-of-N solves with that judge picking.
          </p>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            <Pills
              items={
                JUDGES8.placeholder
                  ? ["placeholder", `old ${JUDGES8.nProblems}-problem run, until the new notebook runs`]
                  : [
                      "measured",
                      `${JUDGES8.nProblems} ${JUDGES8.benchmark} problems`,
                      "every judge read the same chains",
                    ]
              }
            />
            <JudgeBarsFigure />
            <Legend
              items={[
                { cls: "stroke-ink-muted", label: `one chain of thought (${pct(JUDGES8.oneChain)})` },
                { cls: "stroke-compute", label: `majority vote (${pct(JUDGES8.vote)})`, dashed: true },
                { cls: "stroke-ink", label: `at least one chain was correct (${pct(JUDGES8.ceiling)})`, dashed: true },
              ]}
            />
          </figure>
          <p className="text-ink-muted">
            <strong className="text-ink">
              Best-of-N beats majority voting only when the judge is good enough.
            </strong>{" "}
            {JUDGES8.beatVote.length === 0 ? (
              <>
                None of these {JUDGES8.judges.length} judges clears the vote: with every one of them,
                counting the answers does as well or better.
              </>
            ) : (
              <>
                {JUDGES8.beatVote.length} of the {JUDGES8.judges.length} judges clear the vote (
                {andList(JUDGES8.beatVote.map((j) => j.label))}). With the other{" "}
                {JUDGES8.judges.length - JUDGES8.beatVote.length}, counting the answers does as well
                or better.
              </>
            )}
          </p>
        </section>
        {/* Step 5 — the handoff: the argument in plain prose, and only the
            sentence that hands the reader on inside the compute-bordered box. */}
        <section className="flex min-w-0 flex-col gap-3 lg:col-start-1">
          <h2 className="text-xl font-semibold text-ink">5. Where this leaves us</h2>
          <p className="text-ink">
            Choosing works: majority voting and Best-of-N both solve more problems than one chain of
            thought. Against each other they finish <strong>level</strong>, and voting gets there
            without a second model.
          </p>
          <p className="text-ink">
            That comparison is ours: self-consistency and Best-of-N are introduced in different
            chapters of the source we build on
            <Cite n={REF.source} /> and are never set against each other there.
          </p>
          <p className="text-ink">
            A right chain was written on <strong>{pct(PILE8.bars.ceiling)}</strong> of problems.
            Majority voting returns the right answer on {pct(PILE8.bars.vote)} and Best-of-N on{" "}
            {pct(PILE8.bars.best_of_n)}, so a judge recovers only a little of what counting discards.
            <Cite n={REF.stroebl} />
          </p>
          <Handoff>
            So the question is not how many candidates, nor even how good the judge is, but{" "}
            <em>what the judge is reading</em>. Every rule here grades the final answer and none of
            them looks at whether step three followed from step two. <em>Turn the page.</em>
          </Handoff>
        </section>
        <Note kicker="References">
          <RefItem n={REF.source} href="https://mng.bz/lZ5B">
            Raschka 2025, <em>Build a Reasoning Model (From Scratch)</em> (Manning).
          </RefItem>
          <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501">
            Stroebl et al. 2024, <em>Inference Scaling fLaws: The Limits of LLM Resampling with
            Imperfect Verifiers</em> (arXiv 2411.17501).
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}

export default Page8;
