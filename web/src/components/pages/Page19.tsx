"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { PageNav } from "@/components/PageNav";
import { Quiz } from "@/components/Quiz";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { QUIZ, RESOURCES } from "@/lib/quiz";
import { sandboxOutcome } from "@/lib/sandbox";
import { useStore, type VerifierType } from "@/store/useStore";

const PAGE_N = 19;

export function Page19() {
  const page = getPage(PAGE_N)!;
  const levers = useStore((s) => s.levers);
  const setLever = useStore((s) => s.setLever);
  const resetLevers = useStore((s) => s.resetLevers);
  const interactions = useStore((s) => s.interactions);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [preScore, setPreScore] = useState<number | null>(null);
  const [postScore, setPostScore] = useState<number | null>(null);

  const outcome = sandboxOutcome(levers);
  const simsTouched = Object.keys(interactions).length;

  const change = <K extends keyof typeof levers>(k: K, v: (typeof levers)[K]) => {
    setLever(k, v);
    recordInteraction(PAGE_N);
  };

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
        Every lever from the story, on one mixing desk. Predict first, then play, then check what
        you learned.
      </p>

      {/* Pre-quiz */}
      {preScore === null ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">First, predict (pre-quiz)</h2>
          <Quiz mode="pre" onComplete={setPreScore} />
        </section>
      ) : (
        <>
          {/* Sandbox */}
          <section className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-ink">The control panel</h2>
              <Toggle label="Chain-of-thought" checked={levers.cotEnabled} onChange={(v) => change("cotEnabled", v)} />
              <Slider label="Samples" min={1} max={40} value={levers.samples} suffix=" samples" onChange={(v) => change("samples", v)} />
              <fieldset className="flex flex-col gap-1">
                <legend className="text-sm text-ink-muted">Selection</legend>
                <div className="flex gap-2">
                  {(["random", "majority", "verifier"] as VerifierType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={levers.verifier === m}
                      onClick={() => change("verifier", m)}
                      className={`rounded px-3 py-1.5 text-sm capitalize ${
                        levers.verifier === m ? "bg-compute text-canvas" : "bg-surface-raised text-ink-muted"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </fieldset>
              <Slider label="Tree branching (b)" min={1} max={5} value={levers.treeBranching} onChange={(v) => change("treeBranching", v)} />
              <Slider label="Budget forcing ('Wait's)" min={0} max={8} value={levers.budgetForcing} onChange={(v) => change("budgetForcing", v)} />
              <Slider label="Compute budget (×)" min={1} max={16} value={levers.computeBudget} onChange={(v) => change("computeBudget", v)} />
              <button type="button" onClick={() => { resetLevers(); recordInteraction(PAGE_N); }} className="w-fit rounded bg-surface-raised px-3 py-1.5 text-sm text-ink">
                Reset
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-around rounded-lg border border-grid bg-surface p-6">
                <BigNumber value={outcome.accuracy} suffix="%" tone="correct" label="accuracy" />
                <BigNumber value={outcome.cost} decimals={1} suffix="×" tone="compute" label="relative cost" />
              </div>
              <p className="text-sm text-ink-muted">
                Watch the classic trade-off: turning up samples, branching, budget forcing and compute
                all cost more — and budget forcing eventually <em>over-thinks</em> and hurts accuracy.
              </p>
              <p className="text-sm text-ink-muted">
                You&apos;ve interacted with <strong className="text-ink">{simsTouched}</strong> of the
                20 simulations so far.
              </p>
            </div>
          </section>

          {/* Post-quiz */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">Now, check (post-quiz)</h2>
            {postScore === null ? (
              <Quiz mode="post" onComplete={setPostScore} />
            ) : (
              <div className="rounded-lg border border-grid bg-surface p-4">
                <p className="text-lg text-ink">
                  Pre: <strong>{preScore}</strong>/{QUIZ.length} → Post:{" "}
                  <strong className="text-correct">{postScore}</strong>/{QUIZ.length}
                </p>
                <p className="text-sm text-ink-muted">
                  Learning gain: {postScore - preScore >= 0 ? "+" : ""}
                  {postScore - preScore} point{Math.abs(postScore - preScore) === 1 ? "" : "s"}.
                </p>
              </div>
            )}
          </section>

          {/* Resources */}
          <section className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-ink">Go to the sources</h2>
            <ul className="grid gap-1 sm:grid-cols-2">
              {RESOURCES.map((r) => (
                <li key={r.url}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-muted hover:text-compute">
                    {r.label} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs italic text-ink-muted">
              These simulations reproduce the published <em>shapes and endpoints</em> of real results.
              They are illustrative, not a predictor of any specific model&apos;s behaviour.
            </p>
          </section>
        </>
      )}

      <PageNav n={PAGE_N} />
    </article>
  );
}
