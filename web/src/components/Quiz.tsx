"use client";

import { useEffect, useState } from "react";
import type { Question } from "@/lib/page16";

/**
 * The concept check on page 16: a list of single-answer questions that grade
 * themselves as the reader goes.
 *
 * Three decisions worth keeping.
 *
 * IT IS NOT A TEST WITH A SUBMIT BUTTON. Each question resolves the moment it
 * is answered and shows why, because the reader is here to find out whether
 * they understood something, not to be scored on it. A submit button would
 * withhold the explanation until the end, which is when it is least useful.
 *
 * A WRONG ANSWER IS NOT UNDONE. Once a question is answered its radios are
 * disabled, so the reader cannot quietly click around until the tick appears
 * and leave believing they knew it. `Start over` clears everything at once and
 * is the only way back, which makes retrying a deliberate act, and it reshuffles
 * as it clears so a retry cannot be answered from remembered positions.
 *
 * THE RADIOS ARE REAL RADIOS. A grid of divs with click handlers reads as
 * nothing to a screen reader; a fieldset with a legend and a named radio group
 * announces "question 3 of 10, 1 of 4 selected" without any aria plumbing. The
 * verdict is the one thing that has to be announced after the fact, so that
 * line, and only that line, is a live region.
 */

export interface QuizProps {
  questions: Question[];
  /** Called once per question, the first time it is answered. */
  onAnswer?: (correct: boolean) => void;
}

/** Which option index the reader picked, per question id. */
type Answers = Record<string, number>;

/** The order the options are shown in, as indices into `q.options`, per question id. */
type Order = Record<string, number[]>;

const isCorrect = (q: Question, picked: number | undefined) =>
  picked !== undefined && q.options[picked]?.correct === true;

/** Fisher-Yates over the indices, leaving the authored array untouched. */
function shuffled(n: number): number[] {
  const ix = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ix[i], ix[j]] = [ix[j], ix[i]];
  }
  return ix;
}

export function Quiz({ questions, onAnswer }: QuizProps) {
  const [answers, setAnswers] = useState<Answers>({});

  /**
   * The options are re-scrambled on every load, so a reader who refreshes cannot
   * answer from where the right one sat last time, and so the authored order
   * (which tends to put the key in a habitual slot) never becomes the tell.
   *
   * Deliberately unseeded, unlike lib/rng.ts. Everything else in this deck that
   * randomises is seeded so a figure can be reproduced; this is the one place
   * where NOT reproducing is the whole point.
   *
   * It starts as the authored order and shuffles in an effect rather than during
   * render, because this page is statically prerendered: shuffling at render time
   * would make the server's HTML and the client's first pass disagree, and React
   * would log a hydration mismatch on a page whose E2E suite asserts a clean
   * console. The effect runs after hydration, so the two always agree.
   */
  const [order, setOrder] = useState<Order>({});
  useEffect(() => {
    const next: Order = {};
    for (const q of questions) next[q.id] = shuffled(q.options.length);
    setOrder(next);
  }, [questions]);

  /** Display order for one question, falling back to the authored order pre-hydration. */
  const orderFor = (q: Question) => order[q.id] ?? q.options.map((_, i) => i);

  const answered = questions.filter((q) => answers[q.id] !== undefined);
  const right = answered.filter((q) => isCorrect(q, answers[q.id]));
  const done = answered.length === questions.length;

  const pick = (q: Question, index: number) => {
    if (answers[q.id] !== undefined) return; // answered questions do not move
    setAnswers((prev) => ({ ...prev, [q.id]: index }));
    onAnswer?.(q.options[index]?.correct === true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* The running tally. Sticky, because on a page this long the score is
          otherwise off screen exactly when the reader wants it. */}
      <div className="sticky top-20 z-[5] flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-grid bg-surface-raised px-4 py-3">
        <p className="text-sm text-ink">
          <span className="font-mono text-lg font-bold tabular-nums text-compute">
            {right.length}
          </span>
          <span className="text-ink-muted">
            {" "}
            right of {answered.length} answered, {questions.length} in all
          </span>
        </p>
        <div className="flex h-2 flex-1 basis-40 gap-px overflow-hidden rounded">
          {questions.map((q) => {
            const picked = answers[q.id];
            const tone =
              picked === undefined
                ? "bg-grid"
                : isCorrect(q, picked)
                  ? "bg-correct"
                  : "bg-wrong";
            return <div key={q.id} className={`h-full flex-1 ${tone}`} />;
          })}
        </div>
        {answered.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setAnswers({});
              const next: Order = {};
              for (const q of questions) next[q.id] = shuffled(q.options.length);
              setOrder(next);
            }}
            className="rounded border border-grid px-3 py-1 text-sm text-ink-muted hover:text-ink"
          >
            Start over
          </button>
        ) : null}
      </div>

      {questions.map((q, qi) => {
        const picked = answers[q.id];
        const resolved = picked !== undefined;
        const got = isCorrect(q, picked);
        return (
          <fieldset
            key={q.id}
            className={`flex flex-col gap-3 rounded-lg border bg-surface p-4 ${
              resolved ? (got ? "border-correct" : "border-wrong") : "border-grid"
            }`}
          >
            <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-1">
              <span className="font-mono text-sm text-ink-muted">
                {qi + 1} of {questions.length}
              </span>
              <span className="text-xs uppercase tracking-wide text-ink-muted">
                page {q.page} · {q.concept}
              </span>
            </legend>

            <p className="text-ink">{q.stem}</p>

            <div className="flex flex-col gap-1.5">
              {/* Walked in display order; `oi` stays the index into the AUTHORED
                  options, so what gets stored, graded and reported is unaffected
                  by where an option happens to be sitting this load. */}
              {orderFor(q).map((oi) => {
                const o = q.options[oi];
                const chosen = picked === oi;
                const answer = o.correct === true;
                // After answering: the right option is always marked, and the
                // reader's pick is marked wrong if it was not that one. Before
                // answering nothing is marked, or the page gives itself away.
                const tone = !resolved
                  ? "border-grid bg-surface-raised hover:border-compute"
                  : answer
                    ? "border-correct bg-correct/10"
                    : chosen
                      ? "border-wrong bg-wrong/10"
                      : "border-grid bg-surface-raised opacity-60";
                return (
                  <label
                    key={oi}
                    className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 text-sm text-ink ${tone} ${
                      resolved ? "cursor-default" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={chosen}
                      disabled={resolved}
                      onChange={() => pick(q, oi)}
                      className="mt-1 accent-compute"
                    />
                    <span className="flex-1">{o.text}</span>
                    {resolved && answer ? (
                      <span className="shrink-0 font-semibold text-correct">correct</span>
                    ) : null}
                    {resolved && chosen && !answer ? (
                      <span className="shrink-0 font-semibold text-wrong">your answer</span>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <p aria-live="polite" className="text-sm">
              {resolved ? (
                <>
                  <strong className={got ? "text-correct" : "text-wrong"}>
                    {got ? "Right." : "Not quite."}
                  </strong>{" "}
                  <span className="text-ink-muted">{q.why}</span>
                </>
              ) : null}
            </p>
          </fieldset>
        );
      })}

      {done ? (
        <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
          <p className="text-sm">
            <strong>
              {right.length} of {questions.length}.
            </strong>{" "}
            {right.length === questions.length
              ? "Every one. The levers, what each costs, and where each stops working."
              : "The ones you missed are the pages worth a second read; each question says which page it came from."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
