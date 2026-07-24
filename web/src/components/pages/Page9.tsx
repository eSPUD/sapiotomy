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
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        There are two ways to grade a student. Mark the final answer, or mark{" "}
        <strong>every line of the working</strong>. They agree most of the time — and where they
        disagree is where all the interesting failures live.
      </p>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <p>
          <strong>&ldquo;Show your work. Don&apos;t do it in your head.&rdquo;</strong> Almost every
          maths teacher said it, and plenty of them gave more credit for the working than for the
          answer. That always felt like bureaucracy. It was not. A right answer reached by a broken
          method is a <em>trap</em>: it will not survive contact with the next problem, and nobody
          — not the student, not the teacher — has any way of knowing that from the answer alone.
        </p>
      </div>

      {/* --- trace picker ---------------------------------------------- */}
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

      <div className="grid items-start gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section
          aria-label="A sampled solution, graded two ways"
          className="flex flex-col overflow-hidden rounded-lg border border-grid bg-surface"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>{S.question}</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              authored traces · no live model
            </span>
          </div>

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

            {mode === "process" && !isRevealed ? (
              <p className="rounded-lg border border-dashed border-grid bg-surface-raised p-3 text-sm text-ink">
                <strong>You be the process grader.</strong> Mark each step sound or broken, then
                reveal what the PRM says.
              </p>
            ) : null}

            {/* the trace */}
            <ol className="flex flex-col gap-2">
              {trace.steps.map((step, i) => {
                const isLast = i === trace.steps.length - 1;
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
                      <span className="flex-1 text-sm text-ink">{step.text}</span>
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
                        <span className="shrink-0 text-xs text-ink-muted">
                          {isLast ? "" : "not graded"}
                        </span>
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

        <div className="flex flex-col gap-4">
          <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-ink">
            <p>
              <strong>Solution A is the whole argument.</strong> 16/64 really does reduce to 1/4 —
              so cancelling the sixes gets full marks from an outcome grader. But the method is
              not arithmetic, it is a coincidence about these particular digits, and it collapses
              on the very next fraction. Reward the outcome and you have just taught the model that
              cancelling digits works.
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              <strong className="text-ink">Right answer, wrong reasoning.</strong> Only a grader
              that reads the steps can tell the difference — and when the answer is wrong
              (Solution B), only the step grader can tell you <em>which line</em> to fix.
            </p>
          </div>

          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-ink">Best-of-N accuracy on MATH</span>
              <span className="rounded-full border border-compute/60 px-2 py-0.5 text-xs text-compute">
                Lightman et al. 2023
              </span>
            </figcaption>
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

          <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-ink">
            <p className="text-sm">
              <strong>But only where there is a fact to be right about.</strong> Process
              supervision needs each step to have a truth value. Ask for a poem, a melody, a piece
              of visual design, and there is no ground truth mid-stanza — a &ldquo;wrong&rdquo;
              line three verses in may be exactly what makes the ending land. There, judging the
              outcome is not laziness, it is the only honest option. Grade the process when the
              domain has absolutes; grade the outcome when it has taste.
            </p>
          </div>

          <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-ink">
            <p className="text-sm">
              <strong>And finer is not automatically better.</strong> If step-level beats
              answer-level, why not grade every <em>token</em>? Because a half-written line is not
              a claim yet — scoring it punishes a model for the shape of a sentence before the
              sentence has said anything. That is judging a book by its cover, or a poem by its
              first word. The useful unit is the <strong>reasoning step</strong>: the smallest
              piece that is complete enough to be right or wrong.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        <strong>Where this leaves us:</strong> a step-level grader does something the others
        cannot — it can judge a chain <em>while it is still being written</em>. And once you can
        score a half-finished chain, you no longer have to finish the ones that are going badly.{" "}
        <em className="text-ink-muted">
          You can branch, look ahead, and back out. Turn the page.
        </em>
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
