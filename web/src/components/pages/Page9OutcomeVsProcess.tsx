"use client";

/**
 * Page 9, beat 1: what an outcome reward model sees next to what a process
 * reward model sees, on two solutions to one problem. Neither judge has the
 * answer key. On the sound solution both score high, and the PRM's scores show
 * every step holding. On the solution that goes wrong, the ORM's one score drops
 * with no reason attached, while the PRM's scores fall at the step that breaks
 * (2961 = 378 × 7 + 255, when the remainder is 315).
 *
 * Both judges read the whole solution, reasoning included; neither is an
 * answer-key check, which is a rule that never reads the working. What differs
 * is the training label: one per solution (was the answer right?) for the ORM,
 * one per step for the PRM. So the ORM can use the reasoning only as far as it
 * predicts a right answer and cannot point at a step, while the PRM scores each
 * step and can. The ORM panel shows every step inside one bracket with one
 * score for that reason.
 *
 * The beat is about telling a wrong answer from a right one by its steps. A
 * right answer reached through a wrong step is mentioned in the prose as the
 * rarer case, not drawn. How a PRM combines its step scores and picks a
 * solution is beat 2's.
 *
 * DRAFT: both solutions come from the select-by-process figure's illustrative
 * pool, and every score, the ORM's included, is illustrative, not measured.
 */

import { useState } from "react";
import { CUT, POOL, PROBLEMS, bar, ink } from "./Page9SelectByProcess";

/** Two solutions, each with the ORM's one score. Illustrative, like POOL. */
export const SOLUTIONS = [
  { chain: POOL[1], orm: 0.88 },
  { chain: POOL[0], orm: 0.62 },
];

/** Both solutions come from the first problem's pool, so they share its text. */
const PROBLEM = PROBLEMS[0].text;

function Panel({
  name,
  sub,
  testId,
  answer,
  children,
}: {
  name: string;
  sub: string;
  testId: string;
  answer: string;
  children: React.ReactNode;
}) {
  return (
    <div data-testid={testId} className="flex min-w-0 flex-col gap-2 rounded border border-grid p-3">
      <p className="flex flex-col">
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span className="text-xs text-ink-muted">{sub}</span>
      </p>
      {children}
      <p className="mt-auto flex justify-between border-t border-dashed border-grid pt-1 text-xs text-ink-muted">
        answer <span className="font-semibold text-ink">{answer}</span>
      </p>
    </div>
  );
}

export function OutcomeVsProcess() {
  const [at, setAt] = useState(0);
  const { chain, orm } = SOLUTIONS[at];
  // The step where the PRM's scores first fall below the cut, if they do.
  const breakAt = chain.steps.findIndex((s) => s.score < CUT);

  return (
    <figure
      id="orm-vs-prm"
      aria-label="One solution scored by an outcome reward model, one score for all of it, and by a process reward model, one score per step"
      className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="w-full min-w-0 rounded bg-surface-raised px-3 py-1.5 text-sm text-ink sm:w-auto sm:flex-1">
          <span className="font-eyebrow text-xs uppercase text-ink-muted">problem </span>
          {PROBLEM}
        </p>
        {/* Solution arrows, the same control the chain viewers use elsewhere in the story.
            On a phone they take their own row above the problem, at the right. */}
        <div className="order-first ml-auto flex items-center gap-2 sm:order-none">
          <button
            type="button"
            aria-label="Previous solution"
            disabled={at === 0}
            onClick={() => setAt(at - 1)}
            className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
          >
            ‹
          </button>
          <span aria-live="polite" className="w-28 text-center font-mono text-xs tabular-nums text-ink">
            solution {at + 1} of {SOLUTIONS.length}
          </span>
          <button
            type="button"
            aria-label="Next solution"
            disabled={at === SOLUTIONS.length - 1}
            onClick={() => setAt(at + 1)}
            className="h-7 w-7 rounded border border-grid bg-surface text-ink hover:bg-surface-raised disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <div key={at} className="grid animate-fade-in gap-3 sm:grid-cols-2">
        <Panel
          name="Outcome reward model (ORM)"
          sub="one score for the whole solution"
          testId="orm-panel"
          answer={chain.answer}
        >
          {/* The steps sit inside one bracket, because the ORM scores them as one. */}
          <div className="flex items-stretch gap-2">
            <ol className="flex flex-1 flex-col gap-1.5 text-sm text-ink">
              {chain.steps.map((s, i) => (
                <li key={i} className="leading-tight">
                  {s.text}
                </li>
              ))}
            </ol>
            <span aria-hidden="true" className="w-2 rounded-r border-y-2 border-r-2 border-ink-muted" />
            <span className="flex flex-col items-center justify-center">
              <span data-testid="orm-score" className={`text-lg font-semibold tabular-nums ${ink(orm)}`}>
                {orm.toFixed(2)}
              </span>
            </span>
          </div>
        </Panel>

        <Panel
          name="Process reward model (PRM)"
          sub="a score for every step"
          testId="prm-panel"
          answer={chain.answer}
        >
          <ol className="flex flex-col gap-1.5">
            {chain.steps.map((s, i) => {
              const isBreak = i === breakAt;
              return (
                <li key={i} className="flex flex-col">
                  <span className="flex items-baseline justify-between gap-2 text-sm leading-tight text-ink">
                    <span>{s.text}</span>
                    <span
                      data-testid="prm-step-score"
                      data-break={isBreak || undefined}
                      className={`shrink-0 font-semibold tabular-nums ${ink(s.score)} ${
                        isBreak ? "rounded-sm px-0.5 ring-1 ring-current" : ""
                      }`}
                    >
                      {s.score.toFixed(2)}
                    </span>
                  </span>
                  <span className="mt-0.5 h-1 w-full rounded bg-grid">
                    <span className={`block h-1 rounded ${bar(s.score)}`} style={{ width: `${s.score * 100}%` }} />
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>

      <p className="flex items-center justify-end gap-2 text-[11px] text-ink-muted">
        score
        <span className="h-1.5 w-4 rounded bg-wrong" /> below 0.75
        <span className="h-1.5 w-4 rounded bg-correct" /> 0.75 and up
      </p>
    </figure>
  );
}

export function OutcomeOrProcess() {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h2 className="text-xl font-semibold text-ink">1. Outcome or process?</h2>
      {/* Answers the question the page intro ends on. */}
      <p className="text-ink-muted">
        A judge trained only on the outcome reads the steps, but it was never taught to judge them. A
        process judge still takes the answer into account, but it is trained on the reasoning: the
        steps the model took to solve the problem.
      </p>
      <p className="text-ink-muted">
        That changes what the judge can do. An outcome judge can only give a second opinion on the
        answer: one score for how likely it is to be right, with no way to say where the solution went
        wrong. A general model asked the same question may even solve the problem again to check it. A
        process judge checks the reasoning. It can find the step where a solution goes wrong, which is
        a strong hint that the result is wrong. No answer key required. It also catches the rarer
        case of a right answer reached through a wrong step.
      </p>
      <p className="text-ink-muted">
        A judge trained to score the outcome is an <strong className="text-ink">outcome reward
        model</strong> (ORM). One trained to score every step is a{" "}
        <strong className="text-ink">process reward model</strong> (PRM). Let&apos;s look at a quick
        side-by-side view of how each model judges.
      </p>
      <p className="text-xs text-ink-muted">Scores in this draft are illustrative, not measured.</p>
      <OutcomeVsProcess />
    </section>
  );
}
