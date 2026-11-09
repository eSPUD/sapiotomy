"use client";

/**
 * How a PRM picks an answer, in three stages on one problem (the reader picks
 * one of three, each with its own pool): generate four
 * chains, score every step of each, then keep the chain whose lowest step
 * scores highest; its answer is the final answer. There is no answer key: the
 * figure shows what the PRM does, and checking an answer against a key is not
 * part of that. The chains and scores are illustrative.
 *
 * The interactions, none of which asks the reader to judge a step:
 *   · The ‹ › arrows at the top right step through three problems, each with
 *     its own four chains, so the reader sees selection is a rule applied to
 *     whatever comes up.
 *   · The figure opens empty. "Start: Generate" (or the Generate stage
 *     button) plays Generate out: each solution appears whole, one after
 *     another. Reset returns to that empty start with the same four chains.
 *   · Grading plays out one step at a time, one solution after another, with
 *     the step being scored lit, so "score every step" is literal. Reduced
 *     motion skips straight to the end of both.
 *   · Select shows everything at once, with no delay: the sentence, the line
 *     naming the pick, and the kept card (the rest dim). When every chain has
 *     a step below the colour cut, that line says the top one is kept anyway.
 *   · Hovering (or focusing) a graded step lights that step and the steps above
 *     it, and dims the rest: the PRM scores a step from the problem and
 *     everything written before it.
 */

import { useEffect, useState } from "react";

type Step = { text: string; score: number };
type Chain = { answer: string; steps: Step[] };

const PROBLEM = "Find the greatest common divisor of 3339, 2961 and 1491.";

/** Illustrative pool. Each step text stays short enough to sit on one line. */
export const POOL: Chain[] = [
  {
    answer: "3",
    steps: [
      { text: "3339 − 2961 = 378", score: 0.96 },
      { text: "2961 = 378 × 7 + 255", score: 0.18 },
      { text: "378 = 255 × 1 + 123", score: 0.24 },
      { text: "255 = 123 × 2 + 9", score: 0.21 },
      { text: "123 = 9 × 13 + 6", score: 0.22 },
      { text: "9 = 6 × 1 + 3", score: 0.2 },
      { text: "Answer: 3", score: 0.19 },
    ],
  },
  {
    answer: "21",
    steps: [
      { text: "3339 − 2961 = 378", score: 0.96 },
      { text: "2961 = 378 × 7 + 315", score: 0.94 },
      { text: "378 = 315 × 1 + 63", score: 0.95 },
      { text: "315 = 63 × 5 + 0", score: 0.93 },
      { text: "1491 = 63 × 23 + 42", score: 0.91 },
      { text: "63 = 42 × 1 + 21", score: 0.92 },
      { text: "Answer: 21", score: 0.93 },
    ],
  },
  {
    answer: "63",
    steps: [
      { text: "3339 − 2961 = 378", score: 0.96 },
      { text: "2961 = 378 × 7 + 315", score: 0.94 },
      { text: "378 = 315 × 1 + 63", score: 0.95 },
      { text: "315 = 63 × 5 + 0", score: 0.93 },
      { text: "Answer: 63", score: 0.31 },
    ],
  },
  {
    answer: "7",
    steps: [
      { text: "1491 = 7 × 213", score: 0.88 },
      { text: "2961 = 7 × 423", score: 0.86 },
      { text: "3339 = 7 × 477", score: 0.85 },
      { text: "7 divides all three", score: 0.38 },
      { text: "Answer: 7", score: 0.45 },
    ],
  },
  {
    answer: "21",
    steps: [
      { text: "2961 − 1491 = 1470", score: 0.95 },
      { text: "1491 − 1470 = 21", score: 0.94 },
      { text: "1470 = 21 × 70", score: 0.93 },
      { text: "3339 = 21 × 159", score: 0.9 },
      { text: "Answer: 21", score: 0.94 },
    ],
  },
  {
    answer: "21",
    steps: [
      { text: "3339 = 3² × 7 × 53", score: 0.93 },
      { text: "2961 = 3² × 7 × 47", score: 0.92 },
      { text: "1491 = 3 × 7 × 71", score: 0.94 },
      { text: "Shared: 3 × 7", score: 0.9 },
      { text: "Answer: 21", score: 0.93 },
    ],
  },
  {
    answer: "21",
    steps: [
      { text: "3339 = 3² × 7 × 53", score: 0.93 },
      { text: "2961 = 3² × 7 × 47", score: 0.92 },
      { text: "1491 = 3 × 7 × 73", score: 0.29 },
      { text: "Shared: 3 × 7", score: 0.41 },
      { text: "Answer: 21", score: 0.44 },
    ],
  },
  {
    answer: "1",
    steps: [
      { text: "All three are odd", score: 0.82 },
      { text: "1491 is prime", score: 0.21 },
      { text: "Answer: 1", score: 0.19 },
    ],
  },
  {
    answer: "9",
    steps: [
      { text: "3339 = 9 × 371", score: 0.9 },
      { text: "2961 = 9 × 329", score: 0.88 },
      { text: "9 divides all three", score: 0.23 },
      { text: "Answer: 9", score: 0.2 },
    ],
  },
];

/** 2¹⁰⁰ mod 7 is 2. Illustrative, like POOL. */
const POOL_POWER: Chain[] = [
  {
    answer: "2",
    steps: [
      { text: "2³ = 8 ≡ 1 (mod 7)", score: 0.95 },
      { text: "100 = 3 × 33 + 1", score: 0.94 },
      { text: "2¹⁰⁰ = (2³)³³ × 2", score: 0.93 },
      { text: "≡ 1³³ × 2 = 2", score: 0.92 },
      { text: "Answer: 2", score: 0.94 },
    ],
  },
  {
    answer: "1",
    steps: [
      { text: "2³ = 8 ≡ 1 (mod 7)", score: 0.95 },
      { text: "100 = 3 × 33 + 1", score: 0.94 },
      { text: "2¹⁰⁰ ≡ 2³³ (mod 7)", score: 0.22 },
      { text: "33 = 3 × 11", score: 0.61 },
      { text: "2³³ ≡ 1", score: 0.3 },
      { text: "Answer: 1", score: 0.25 },
    ],
  },
  {
    answer: "2",
    steps: [
      { text: "Fermat: 2⁶ ≡ 1", score: 0.93 },
      { text: "100 = 6 × 16 + 4", score: 0.94 },
      { text: "2¹⁰⁰ ≡ 2⁴ = 16", score: 0.9 },
      { text: "16 ≡ 2 (mod 7)", score: 0.92 },
      { text: "Answer: 2", score: 0.93 },
    ],
  },
  {
    answer: "3",
    steps: [
      { text: "Fermat: 2⁶ ≡ 1", score: 0.93 },
      { text: "100 = 6 × 16 + 4", score: 0.94 },
      { text: "2¹⁰⁰ ≡ 2⁴ = 16", score: 0.9 },
      { text: "16 ≡ 3 (mod 7)", score: 0.12 },
      { text: "Answer: 3", score: 0.2 },
    ],
  },
  {
    // Right answer, wrong reasoning: the cycle is 2, 4, 1, and 100 being even says nothing.
    answer: "2",
    steps: [
      { text: "Cycle: 2, 4, 1", score: 0.93 },
      { text: "100 is even", score: 0.6 },
      { text: "Even powers give 2", score: 0.17 },
      { text: "Answer: 2", score: 0.38 },
    ],
  },
  {
    answer: "6",
    steps: [
      { text: "2¹⁰⁰ is huge", score: 0.7 },
      { text: "Last digit is 6", score: 0.4 },
      { text: "6 mod 7 = 6", score: 0.15 },
      { text: "Answer: 6", score: 0.2 },
    ],
  },
  {
    answer: "2",
    steps: [
      { text: "2⁵ = 32 ≡ 4", score: 0.93 },
      { text: "2¹⁰⁰ = (2⁵)²⁰", score: 0.94 },
      { text: "≡ 4²⁰ (mod 7)", score: 0.92 },
      { text: "4³ = 64 ≡ 1", score: 0.91 },
      { text: "4²⁰ ≡ 4² = 16 ≡ 2", score: 0.9 },
      { text: "Answer: 2", score: 0.93 },
    ],
  },
];

/** 360 = 2³ × 3² × 5 has 24 divisors. Illustrative, like POOL. */
const POOL_DIVISORS: Chain[] = [
  {
    answer: "6",
    steps: [
      { text: "360 = 2³ × 3² × 5", score: 0.95 },
      { text: "Exponents: 3, 2, 1", score: 0.94 },
      { text: "3 × 2 × 1 = 6", score: 0.14 },
      { text: "Answer: 6", score: 0.2 },
    ],
  },
  {
    answer: "24",
    steps: [
      { text: "360 = 2³ × 3² × 5", score: 0.95 },
      { text: "(3+1)(2+1)(1+1)", score: 0.93 },
      { text: "= 4 × 3 × 2", score: 0.94 },
      { text: "Answer: 24", score: 0.94 },
    ],
  },
  {
    answer: "48",
    steps: [
      { text: "360 = 6 × 60", score: 0.9 },
      { text: "6 has 4 divisors", score: 0.9 },
      { text: "60 has 12 divisors", score: 0.88 },
      { text: "4 × 12 = 48", score: 0.13 },
      { text: "Answer: 48", score: 0.18 },
    ],
  },
  {
    answer: "20",
    steps: [
      { text: "360 = 2³ × 3² × 5", score: 0.95 },
      { text: "(3+1)(2+1)(1+1)", score: 0.93 },
      { text: "= 4 × 3 × 2 = 20", score: 0.11 },
      { text: "Answer: 20", score: 0.15 },
    ],
  },
  {
    answer: "24",
    steps: [
      { text: "360 = 2³ × 45", score: 0.9 },
      { text: "45 = 3² × 5", score: 0.93 },
      { text: "Divisors: 4 × 3 × 2", score: 0.92 },
      { text: "Answer: 24", score: 0.93 },
    ],
  },
  {
    // Right answer, wrong reasoning: 36 and 10 share a factor, and "minus 12" is invented.
    answer: "24",
    steps: [
      { text: "360 = 36 × 10", score: 0.9 },
      { text: "36 has 9 divisors", score: 0.92 },
      { text: "10 has 4 divisors", score: 0.93 },
      { text: "9 × 4 = 36, minus 12", score: 0.12 },
      { text: "Answer: 24", score: 0.3 },
    ],
  },
  {
    answer: "24",
    steps: [
      { text: "√360 ≈ 19", score: 0.9 },
      { text: "Divisors below 19: 12", score: 0.91 },
      { text: "Each pairs with one", score: 0.9 },
      { text: "Answer: 24", score: 0.93 },
    ],
  },
];

/**
 * The four chains each problem shows, by pool index. Between them the three
 * cover the cases the figure has to make plain: a sound chain kept over weak
 * ones (1); every chain weak, and the least weak still kept (2); a right
 * answer reached by a bad step, scored low beside a sound chain with the same
 * answer (3).
 */
export const PROBLEMS: { text: string; pool: Chain[]; draw: number[] }[] = [
  { text: PROBLEM, pool: POOL, draw: [0, 1, 2, 3] },
  { text: "What is the remainder when 2¹⁰⁰ is divided by 7?", pool: POOL_POWER, draw: [1, 3, 4, 5] },
  { text: "How many positive divisors does 360 have?", pool: POOL_DIVISORS, draw: [0, 1, 2, 5] },
];

const N = 4;
/** Milliseconds between solutions appearing while Generate plays out. */
export const WRITE_MS = 700;
/** Milliseconds per step while grading plays out, one solution at a time. */
export const ROW_MS = 320;

const STAGES = [
  { n: 1, name: "Generate", note: "The generation model writes four different chains with sampling." },
  {
    n: 2,
    name: "Grade",
    note: "A process reward model (PRM), separate from the generation model, scores each step of each chain.",
  },
  {
    n: 3,
    name: "Select",
    note: "The chain with the highest score is kept, and its answer becomes the final answer.",
  },
] as const;
const LAST = STAGES.length;

/** Where the step colour changes. Colour only: selection never uses it. */
export const CUT = 0.75;
export const bar = (s: number) => (s >= CUT ? "bg-correct" : "bg-wrong");
export const ink = (s: number) => (s >= CUT ? "text-correct-ink" : "text-wrong-ink");


const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function SelectByProcess() {
  /** 0 before the reader starts; then 1 Generate, 2 Grade, 3 Select. */
  const [stage, setStage] = useState(0);
  const [problem, setProblem] = useState(0);
  const { pool, draw } = PROBLEMS[problem];
  /** How many solutions have appeared so far; N once all four have. */
  const [written, setWritten] = useState(0);
  /**
   * How many steps have been scored, counting solution 1's steps first, then
   * solution 2's, and so on; Infinity once grading has finished.
   */
  const [shown, setShown] = useState(0);
  const [hover, setHover] = useState<{ c: number; s: number } | null>(null);

  const rows = draw.map((i) => {
    const c = pool[i];
    return { ...c, low: Math.min(...c.steps.map((s) => s.score)) };
  });
  // Where each solution's steps start in the one-at-a-time grading order.
  const offsets = rows.map((_, i) => rows.slice(0, i).reduce((n, r) => n + r.steps.length, 0));
  const total = rows.reduce((n, r) => n + r.steps.length, 0);
  const graded = stage >= 2;
  const done = shown >= total;
  const selecting = stage >= 3;
  const kept = rows.reduce((b, r, i) => (r.low > rows[b].low ? i : b), 0);
  // The step being scored right now, while grading plays out.
  const scoring =
    stage === 2 && !done && shown > 0
      ? (() => {
          const at = shown - 1;
          const c = offsets.findLastIndex((o) => o <= at);
          return { c, s: at - offsets[c] };
        })()
      : null;

  // Generate plays out one whole solution at a time whenever it starts afresh.
  useEffect(() => {
    if (stage !== 1 || written >= N) return;
    if (prefersReducedMotion()) {
      setWritten(N);
      return;
    }
    const t = setTimeout(() => setWritten((v) => v + 1), WRITE_MS);
    return () => clearTimeout(t);
  }, [stage, written]);

  // Grading plays out the same way whenever the Grade stage starts afresh.
  useEffect(() => {
    if (stage !== 2 || shown >= total) return;
    if (prefersReducedMotion()) {
      setShown(total);
      return;
    }
    const t = setTimeout(() => setShown((v) => v + 1), ROW_MS);
    return () => clearTimeout(t);
  }, [stage, shown, total]);

  const goTo = (n: number) => {
    setHover(null);
    // Before the start and at Generate nothing is written yet; later stages show all four.
    setWritten(n <= 1 ? 0 : Infinity);
    if (n <= 1) setShown(0);
    // Jumping straight to Select skips the replay; it has nothing to watch.
    if (n >= 3) setShown(Infinity);
    if (n === 2 && stage >= 3) setShown(Infinity);
    setStage(n);
  };

  // A new problem starts over: its own four chains, back at the empty start.
  const pickProblem = (p: number) => {
    setProblem(p);
    goTo(0);
  };

  const writing = stage === 1 && written < N;
  const best = rows[kept];
  const pickLine =
    best.low >= CUT
      ? `Solution ${kept + 1} has the highest score, ${best.low.toFixed(2)}, so ${best.answer} is the final answer.`
      : `Every solution has a step below ${CUT}. Solution ${kept + 1} still has the highest score, ${best.low.toFixed(2)}, so ${best.answer} is the final answer.`;

  const focus = hover && graded ? hover : scoring;
  const focusLine = focus
    ? `Step ${focus.s + 1} of solution ${focus.c + 1}: the PRM read the problem and steps 1 to ${focus.s + 1}.`
    : stage === 2 && done
      ? "A solution scores its weakest step: one doubtful step pulls it down, whatever answer it reaches."
      : "";

  return (
    <figure
      id="prm-select"
      className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* the three stages */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Stage">
          {STAGES.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 ? <span className="text-ink-muted" aria-hidden="true">→</span> : null}
              <button
                type="button"
                aria-pressed={stage === s.n}
                onClick={() => goTo(s.n)}
                className={`rounded px-3 py-1 text-sm ${
                  stage === s.n
                    ? "bg-compute font-semibold text-ink"
                    : stage > s.n
                      ? "border border-compute text-ink"
                      : "border border-grid bg-surface-raised text-ink-muted"
                }`}
              >
                {s.n}. {s.name}
              </button>
            </div>
          ))}
        </div>
        {/* Problem arrows, the same control the chain viewers use elsewhere in the story. */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous problem"
            disabled={problem === 0}
            onClick={() => pickProblem(problem - 1)}
            className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
          >
            ‹
          </button>
          <span aria-live="polite" className="w-28 text-center font-mono text-xs tabular-nums text-ink">
            problem {problem + 1} of {PROBLEMS.length}
          </span>
          <button
            type="button"
            aria-label="Next problem"
            disabled={problem === PROBLEMS.length - 1}
            onClick={() => pickProblem(problem + 1)}
            className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>
      {/* The stage's sentence is the figure's headline, with the live detail under it in
          the same callout, which hugs its text. Before the start there is no sentence yet. */}
      <div>
        {stage >= 1 ? (
          <div
            key={stage}
            className="flex animate-fade-in flex-col gap-1 rounded-r border-l-4 border-compute bg-compute/10 px-3 py-2"
          >
            <p className="text-base font-semibold leading-snug text-ink sm:text-lg">{STAGES[stage - 1].note}</p>
            {selecting ? (
              <p className="text-sm text-ink-muted empty:hidden" aria-live="polite" data-testid="prm-pick">
                {pickLine}
              </p>
            ) : (
              <p className="text-sm text-ink-muted empty:hidden" aria-live="polite" data-testid="prm-focus">
                {focusLine}
              </p>
            )}
          </div>
        ) : null}
      </div>

      <p className="rounded bg-surface-raised px-3 py-1.5 text-sm text-ink">
        <span className="font-eyebrow text-xs uppercase text-ink-muted">problem </span>
        <span data-testid="prm-problem">{PROBLEMS[problem].text}</span>
      </p>

      {/* four solutions */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" onMouseLeave={() => setHover(null)}>
        {rows.map((c, ci) => {
          const isKept = selecting && ci === kept;
          const scored = graded && shown >= offsets[ci] + c.steps.length;
          const wrote = ci < written;
          return (
            <div
              key={`${draw[ci]}-${ci}`}
              data-testid="prm-solution"
              className={`flex flex-col gap-1 rounded border p-2 transition-opacity ${
                isKept ? "border-compute ring-2 ring-compute" : "border-grid"
              } ${selecting && !isKept ? "opacity-40" : ""}`}
            >
              <p className="flex justify-between text-[11px] font-semibold">
                <span className="text-ink-muted">Solution {ci + 1}</span>
                {isKept ? <span className="text-compute-ink">kept</span> : null}
              </p>
              {/* Held to the longest chain in the pool, so a re-draw never resizes the card. */}
              <ol className="flex min-h-[10.3rem] flex-col gap-1">
                {c.steps.map((s, si) => {
                  // A solution that has not appeared yet is not drawn at all.
                  if (!wrote) return null;
                  const showScore = graded && offsets[ci] + si < shown;
                  const inFocus = focus?.c === ci;
                  const read = inFocus && si <= focus!.s;
                  const current = inFocus && si === focus!.s;
                  // Once a solution is scored, its lowest step is the one its score came from.
                  const isLowest = scored && si === c.steps.findIndex((x) => x.score === c.low);
                  return (
                    <li
                      key={si}
                      tabIndex={showScore ? 0 : undefined}
                      onMouseEnter={showScore ? () => setHover({ c: ci, s: si }) : undefined}
                      onFocus={showScore ? () => setHover({ c: ci, s: si }) : undefined}
                      onBlur={() => setHover(null)}
                      className={`flex flex-col rounded px-0.5 transition-opacity ${stage === 1 ? "animate-fade-in" : ""} ${
                        current ? "bg-compute/20" : ""
                      } ${inFocus && !read ? "opacity-25" : ""} ${showScore ? "cursor-default" : ""}`}
                    >
                      <span className="flex items-baseline justify-between gap-1 text-[11px] leading-tight text-ink">
                        <span className="whitespace-nowrap">{s.text}</span>
                        {showScore ? (
                          <span
                            data-lowest={isLowest || undefined}
                            className={`shrink-0 font-semibold tabular-nums ${ink(s.score)} ${
                              isLowest ? "rounded-sm px-0.5 ring-1 ring-current" : ""
                            }`}
                          >
                            {s.score.toFixed(2)}
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 h-1 w-full rounded bg-grid">
                        {showScore ? (
                          <span
                            className={`block h-1 rounded ${bar(s.score)}`}
                            style={{ width: `${s.score * 100}%` }}
                          />
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-auto flex items-baseline justify-between border-t border-dashed border-grid pt-1 text-xs">
                {selecting ? (
                  // Score and answer side by side: the score decides, the answer is what is kept.
                  <>
                    <span className="text-ink-muted">
                      score{" "}
                      <span
                        data-testid="prm-chain-score"
                        className={`rounded-sm px-1 font-semibold tabular-nums ${ink(c.low)} ${
                          isKept ? "ring-2 ring-compute" : ""
                        }`}
                      >
                        {c.low.toFixed(2)}
                      </span>
                    </span>
                    <span className="text-ink-muted">
                      answer{" "}
                      <span className={`font-semibold ${isKept ? "text-compute-ink" : "text-ink"}`}>{c.answer}</span>
                    </span>
                  </>
                ) : graded ? (
                  <>
                    <span className="text-ink-muted">score{scored ? " = lowest step" : ""}</span>
                    {scored ? (
                      <span className={`font-semibold tabular-nums ${ink(c.low)}`}>{c.low.toFixed(2)}</span>
                    ) : (
                      <span className="text-ink-muted">…</span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-ink-muted">answer</span>
                    {wrote ? (
                      <span className="animate-fade-in font-semibold text-ink">{c.answer}</span>
                    ) : (
                      <span className="text-ink-muted">…</span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {/* Next stops at Select; Reset is the way back. */}
          <button
            type="button"
            disabled={stage === LAST || writing || (stage === 2 && !done)}
            onClick={() => goTo(stage + 1)}
            className="rounded bg-chrome px-3 py-1 text-sm font-semibold text-canvas disabled:opacity-50"
          >
            {stage === 0 ? "Start: Generate ▸" : stage === LAST ? "Next ▸" : `Next: ${STAGES[stage].name} ▸`}
          </button>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-2">
          {graded ? (
            <span className="flex items-center gap-2 text-[11px] text-ink-muted">
              step score
              <span className="h-1.5 w-4 rounded bg-wrong" /> below 0.75
              <span className="h-1.5 w-4 rounded bg-correct" /> 0.75 and up
            </span>
          ) : null}
          {/* Back to before the start, same four chains, waiting for Start: Generate. */}
          <button
            type="button"
            onClick={() => goTo(0)}
            className="rounded border border-chrome px-3 py-1 text-sm font-semibold text-ink hover:bg-chrome/5"
          >
            ↺ Reset
          </button>
        </div>
      </div>
    </figure>
  );
}

export function WhatIsAPrm() {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink">2. How does a PRM pick?</h2>
      <p className="text-ink-muted">
        A PRM gives every step a score, but Best-of-N needs a single pick. Each step is scored from the
        problem and the steps written before it, with no answer key. The solution with the highest
        score is always the one chosen, even when every solution has a weak step.
      </p>
      <p className="text-xs text-ink-muted">These scores are illustrative.</p>
      <SelectByProcess />
    </section>
  );
}
