"use client";

/**
 * Page 9, "Outcome vs Process Supervision" — page 8 ended on the question of
 * what the judge is actually reading. Here is the answer, and it is a fork:
 * grade the final answer (an outcome reward model), or grade every step (a
 * process reward model).
 *
 * The teaching case is the one every grade-school teacher was defending when
 * they said "show your work, don't do it in your head". Solution A is the
 * famous fake cancellation: 16/64, cancel the sixes, get 1/4. The answer is
 * RIGHT. The reasoning is nonsense. An outcome grader signs off and, worse,
 * rewards the nonsense — which is precisely how you train a model to keep doing
 * it. That is why a teacher sometimes gave more credit for the work than for
 * the answer.
 *
 * Solution B is the other half: a wrong GCD at step 2, with steps 3 and 4
 * perfectly valid GIVEN that mistake. Outcome grading can only say "wrong".
 * Process grading points at step 2 — it LOCALISES the break, which is the
 * signal you actually need.
 *
 * The interactive lets the reader be the grader first: paint each step green or
 * red, then reveal the PRM's labels and compare. Predict-observe-explain, with
 * the reader's own judgement as the prediction.
 *
 * Two caveats the page refuses to skip. First, process supervision needs there
 * to BE a fact about each step: for poetry or art there is no ground truth
 * mid-stanza, and grading the outcome is the honest choice. Second, finer is
 * not automatically better — grading every token is judging a book by its first
 * page. The right grain is the reasoning step.
 *
 * Anchored to Lightman et al. 2023 (data/prm-vs-orm.json): MATH, best-of-N,
 * majority 69.6% / ORM 72.4% / PRM 78.2%.
 */

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { SUPERVISION } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;
const S = SUPERVISION;

type Mode = "outcome" | "process";
type Mark = "unmarked" | "ok" | "error";

export function Page9() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const data = curves.prmVsOrm;
  const { majority, orm, prm } = data.fit!.params;

  const [traceKey, setTraceKey] = useState(S.traces[0].key);
  const [mode, setMode] = useState<Mode>("outcome");
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const trace = S.traces.find((t) => t.key === traceKey)!;
  const myMarks: Mark[] = marks[traceKey] ?? trace.steps.map(() => "unmarked");
  const isRevealed = revealed[traceKey] ?? false;
  const allMarked = myMarks.every((m) => m !== "unmarked");

  const setMark = (i: number, m: Mark) => {
    recordInteraction(PAGE_N);
    setMarks((prev) => {
      const next = [...(prev[traceKey] ?? trace.steps.map(() => "unmarked" as Mark))];
      next[i] = m;
      return { ...prev, [traceKey]: next };
    });
  };

  const agreement = myMarks.filter(
    (m, i) => m !== "unmarked" && (m === "ok") === trace.steps[i].ok,
  ).length;

  const bars = [
    { label: "Majority vote", value: majority, tone: "bg-grid", note: "no grader at all" },
    { label: "Outcome RM (ORM)", value: orm, tone: "bg-compute", note: "grades the answer" },
    { label: "Process RM (PRM)", value: prm, tone: "bg-correct", note: "grades every step" },
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

      {/* Left = the numbered walk-through · Right = instructions + references */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8">
          <p className="text-lg text-ink-muted">
            Two ways to grade a student: mark the final answer, or mark{" "}
            <strong className="text-ink">every line of the working</strong>. Where they disagree is
            where the interesting failures live. Every maths teacher who said{" "}
            <em>&ldquo;show your work&rdquo;</em> was defending the second one, and they were right:
            a correct answer reached by a broken method is a trap, and nobody can tell from the
            answer alone.
          </p>

          {/* Step 1 — grade it yourself */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. Grade it yourself
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                {S.question} · authored traces · no live model
              </span>
            </h2>

            {/* trace picker */}
            <div className="flex flex-wrap gap-2">
              {S.traces.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={traceKey === t.key}
                  onClick={() => {
                    setTraceKey(t.key);
                    recordInteraction(PAGE_N);
                  }}
                  className={`rounded px-3 py-1.5 text-sm ${
                    traceKey === t.key
                      ? "bg-compute text-canvas"
                      : "border border-grid bg-surface text-ink-muted"
                  }`}
                >
                  {t.label}
                  <span className="ml-2 text-xs opacity-80">{t.kind}</span>
                </button>
              ))}
            </div>

            <section
              aria-label="A sampled solution, graded two ways"
              className="flex flex-col rounded-lg border-l-4 border-compute bg-surface"
            >
              <div className="flex flex-col gap-4 p-4">
            {/* grading mode */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Grading style"
            >
              {(
                [
                  { key: "outcome", label: "Outcome view", sub: "one verdict, at the end" },
                  { key: "process", label: "Process view", sub: "a verdict per step" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode === m.key}
                  onClick={() => {
                    setMode(m.key);
                    recordInteraction(PAGE_N);
                  }}
                  className={`flex flex-col rounded px-3 py-1.5 text-left text-sm ${
                    mode === m.key
                      ? "bg-compute text-canvas"
                      : "border border-grid bg-surface-raised text-ink-muted"
                  }`}
                >
                  <span className="font-semibold">{m.label}</span>
                  <span className="text-xs opacity-80">{m.sub}</span>
                </button>
              ))}
            </div>

            {mode === "outcome" ? (
              <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                <strong>An outcome grader reads one thing: the answer.</strong> The working is
                redacted below because that is exactly what this grader sees of it. Switch to{" "}
                <strong>Process view</strong> to read the steps.
              </p>
            ) : !isRevealed ? (
              <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                <strong>You be the process grader.</strong> Mark each step sound or broken, then
                reveal what the PRM says.
              </p>
            ) : null}

            {/* the trace */}
            <ol className="flex flex-col gap-2">
              {trace.steps.map((step, i) => {
                const showProcess = mode === "process";
                const mine = myMarks[i];
                const shown = showProcess && isRevealed;
                return (
                  <li
                    key={i}
                    className={`flex flex-col gap-1.5 rounded-lg border-l-4 p-3 ${
                      shown
                        ? step.ok
                          ? "border-correct bg-correct/10"
                          : "border-wrong bg-wrong/15"
                        : "border-grid bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 font-mono text-xs text-compute">{i + 1}</span>
                      {/* Outcome view REDACTS the working. The grader cannot read
                          it, so neither can you until you switch views. Showing
                          the text here with a "not graded" tag made the two views
                          near-identical and let the reader see the broken step the
                          grader is supposed to be blind to. */}
                      {mode === "outcome" ? (
                        <span className="flex flex-1 items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="block h-3 rounded-sm bg-grid"
                            style={{ width: `${Math.min(92, 28 + step.text.length * 1.1)}%` }}
                          />
                          <span className="sr-only">
                            Step {i + 1} is redacted in the outcome view; the outcome grader does
                            not read it. Switch to the process view to read it.
                          </span>
                        </span>
                      ) : (
                        <span className="flex-1 text-sm text-ink">{step.text}</span>
                      )}
                      {shown ? (
                        <span
                          className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                            step.ok ? "bg-correct/25 text-correct" : "bg-wrong/25 text-wrong"
                          }`}
                        >
                          {step.ok ? "step sound" : "step broken"}
                        </span>
                      ) : showProcess ? (
                        <span className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-pressed={mine === "ok"}
                            aria-label={`Mark step ${i + 1} sound`}
                            onClick={() => setMark(i, "ok")}
                            className={`rounded px-2 py-0.5 text-xs ${
                              mine === "ok"
                                ? "bg-correct text-canvas"
                                : "border border-grid text-ink-muted"
                            }`}
                          >
                            sound
                          </button>
                          <button
                            type="button"
                            aria-pressed={mine === "error"}
                            aria-label={`Mark step ${i + 1} broken`}
                            onClick={() => setMark(i, "error")}
                            className={`rounded px-2 py-0.5 text-xs ${
                              mine === "error"
                                ? "bg-wrong text-canvas"
                                : "border border-grid text-ink-muted"
                            }`}
                          >
                            broken
                          </button>
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs text-ink-muted">not read</span>
                      )}
                    </div>
                    {shown && step.note ? (
                      <p className="pl-6 text-xs text-ink-muted">{step.note}</p>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            {mode === "process" && !isRevealed ? (
              <button
                type="button"
                disabled={!allMarked}
                onClick={() => {
                  setRevealed((r) => ({ ...r, [traceKey]: true }));
                  recordInteraction(PAGE_N);
                }}
                className="self-start rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                {allMarked ? "Reveal the PRM's labels ▸" : "Mark every step first"}
              </button>
            ) : null}

            {mode === "process" && isRevealed ? (
              <p className="text-sm text-ink-muted">
                You agreed with the process grader on{" "}
                <strong className="text-ink">
                  {agreement} of {trace.steps.length}
                </strong>{" "}
                steps.
              </p>
            ) : null}

            {/* the verdict */}
            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-3">
              <p className="text-sm text-ink">
                <span className="font-mono text-ink-muted">final answer → </span>
                <strong className={trace.outcomeOk ? "text-correct" : "text-wrong"}>
                  {trace.finalAnswer}
                </strong>
              </p>
              {mode === "outcome" ? (
                <div
                  className={`rounded-lg border-l-4 p-3 text-sm ${
                    trace.outcomeOk ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                  }`}
                >
                  <p className="text-ink">
                    <span
                      className={`font-semibold ${
                        trace.outcomeOk ? "text-correct" : "text-wrong"
                      }`}
                    >
                      {trace.outcomeOk ? "👍 Outcome grader: pass." : "👎 Outcome grader: fail."}
                    </span>{" "}
                    {trace.ormVerdict}
                  </p>
                </div>
              ) : isRevealed ? (
                <div className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm">
                  <p className="text-ink">
                    <span className="font-semibold text-compute">Process grader:</span>{" "}
                    {trace.prmVerdict}
                  </p>
                </div>
              ) : null}
            </div>
              </div>
            </section>

            <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-sm text-ink">
              <strong>Solution A is the whole argument.</strong> 16/64 really does reduce to 1/4, so
              cancelling the sixes gets full marks from an outcome grader. But that is a coincidence
              about these digits, not arithmetic, and it collapses on the next fraction. Reward the
              outcome and you have taught the model that cancelling digits works. Only a grader that
              reads the steps can tell; and when the answer is wrong (Solution B), only it can tell
              you <em>which line</em> to fix.
            </div>
          </section>

          {/* Step 2 — what step-grading buys */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. What step-grading buys
              <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
                Lightman et al. 2023 · MATH · best-of-N
              </span>
            </h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border-l-4 border-grid bg-surface p-4">
            <div
              className="flex flex-col gap-2"
              role="img"
              aria-label={`Best-of-N accuracy on MATH: majority vote ${majority} percent, outcome reward model ${orm} percent, process reward model ${prm} percent.`}
            >
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-2 text-sm">
                  <span className="w-36 shrink-0 text-ink-muted">
                    {b.label}
                    <span className="block text-xs text-ink-muted">{b.note}</span>
                  </span>
                  <div className="h-5 flex-1 rounded bg-surface-raised">
                    <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono tabular-nums text-ink">
                    {b.value}%
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              Grading the steps is worth{" "}
              <strong className="text-ink">+{(prm - orm).toFixed(1)} points</strong> over grading
              the answer, on the same candidates.
            </p>
          </figure>
          </section>

          {/* Step 3 — the two limits */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">3. Two limits, then the handoff</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
                <strong>Only where there is a fact.</strong> Process supervision needs every step to
                have a truth value. Ask for a poem and there is no ground truth mid-stanza; a
                &ldquo;wrong&rdquo; line three verses in may be what makes the ending land. Grade the
                process when the domain has absolutes, the outcome when it has taste.
              </div>
              <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
                <strong>Finer is not better.</strong> If step beats answer, why not grade every{" "}
                <em>token</em>? A half-written line is not a claim yet, so scoring it punishes the
                shape of a sentence before it has said anything. The useful unit is the{" "}
                <strong>reasoning step</strong>: the smallest piece complete enough to be right or
                wrong.
              </div>
            </div>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              A step-level grader can do what the others cannot: judge a chain{" "}
              <em>while it is still being written</em>. Once you can score a half-finished chain,
              you need not finish the ones going badly.{" "}
              <em className="text-ink-muted">
                You can branch, look ahead, and back out. Turn the page.
              </em>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              How to read this page
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>
                Pick a solution, then switch to <strong className="text-ink">Process view</strong>{" "}
                and mark each step yourself before revealing the grader.
              </li>
              <li>
                Solution A is the one to try first: the answer is right and the method is nonsense.
              </li>
              <li>
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd>{" "}
                move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </h2>
            <p className="text-sm text-ink-muted">
              Lightman et al. 2023 (MATH, best-of-N): majority {majority}%, ORM {orm}%, PRM {prm}%.
              The three solutions are authored teaching examples. Links at the foot.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={data.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the three solutions are authored teaching examples, not model transcripts, and their
        arithmetic is recomputed by the test suite: 16/64 = 1/4, gcd(16, 64) = 16, and Solution
        B&apos;s 2/8 follows correctly from its wrong divisor of 8 · Solution A is the classical
        &ldquo;anomalous cancellation&rdquo; example, right answer by invalid method · the bar
        chart is verbatim from Lightman et al. 2023, &ldquo;Let&apos;s Verify Step by Step&rdquo;
        (arXiv:2305.20050, ICLR 2024): MATH, best-of-N, majority vote {majority}%, outcome reward
        model {orm}%, process reward model {prm}%
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
