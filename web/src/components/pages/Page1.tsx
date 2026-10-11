"use client";

import { useEffect, useRef, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { SystemSort } from "@/components/pages/SystemSort";
import { ACTS, getPage } from "@/lib/pages";
import { SYSTEM_EXAMPLES } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 1;

/** Page 1's references, numbered in order of first appearance. */
const REF = { kahneman: 1, stanovich: 2 } as const;
const fmt = (ms: number) => `${(ms / 1000).toFixed(1)} s`;
/** Both systems run in lockstep on one clock, one step per beat, and step 1
 *  appears in both panels on the same beat. Each answer lands with its last
 *  step, so System 1 finishes on beat 1 and System 2 on its final beat. */
const STEP_MS = 800;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({
  kicker,
  flush = false,
  children,
}: {
  kicker: string;
  /** Drop the top padding. That padding clears a step's h2 so the note lines up
   *  with the prose under it; beside a headingless row it drops a line too low. */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside className={`flex flex-col gap-2 text-sm text-ink-muted ${flush ? "" : "lg:pt-9"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** An empty step row: holds a step's height until the step is written. Hidden
 *  from the a11y tree, since it is spacing, not content. */
function StepSlot() {
  return (
    <li aria-hidden="true" className="invisible flex flex-wrap items-baseline gap-2">
      <span className="text-xs uppercase tracking-wide">&nbsp;</span>
      <span>&nbsp;</span>
    </li>
  );
}

export function Page1() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  // One "Calculate" press starts both systems at the same moment, each with its
  // own stopwatch: System 1 finishes almost at once, System 2 keeps working.
  const [started, setStarted] = useState(false);
  const [s1Step, setS1Step] = useState(0);
  const [s1Done, setS1Done] = useState(false);
  const [s1Ms, setS1Ms] = useState(0);
  const [s2Step, setS2Step] = useState(0);
  const [s2Done, setS2Done] = useState(false);
  const [s2Ms, setS2Ms] = useState(0);
  const [running, setRunning] = useState(false);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef({ s1: false, s2: false });
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [announce, setAnnounce] = useState("");
  // Which example the figure shows. The first render is always example 0 (so the
  // server and client agree). Calculate runs the example on screen if it has not
  // been run since the page loaded or since Reset; otherwise it draws a new one at
  // random, never repeating the one just shown.
  const [exIdx, setExIdx] = useState(0);
  const ex = SYSTEM_EXAMPLES[exIdx];
  const replayRef = useRef(true);
  const nSteps = ex.slow.steps.length;

  const clearTimers = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const elapsed = () => (startRef.current == null ? 0 : performance.now() - startRef.current);
  const later = (ms: number, fn: () => void) => timeoutsRef.current.push(setTimeout(fn, ms));

  const reset = () => {
    clearTimers();
    setStarted(false);
    setRunning(false);
    setS1Step(0);
    setS1Done(false);
    setS1Ms(0);
    setS2Step(0);
    setS2Done(false);
    setS2Ms(0);
    startRef.current = null;
    replayRef.current = true;
    setAnnounce("Reset.");
  };

  const calculate = () => {
    if (running) return;
    clearTimers();
    let next = exIdx;
    if (!replayRef.current) {
      const options = SYSTEM_EXAMPLES.map((_, i) => i).filter((i) => i !== exIdx);
      next = options[Math.floor(Math.random() * options.length)];
      setExIdx(next);
    }
    replayRef.current = false;
    const run = SYSTEM_EXAMPLES[next];
    const steps = run.slow.steps.length;
    recordInteraction(PAGE_N);
    setStarted(true);
    setRunning(true);
    setS1Step(0);
    setS1Done(false);
    setS1Ms(0);
    setS2Step(0);
    setS2Done(false);
    setS2Ms(0);
    doneRef.current = { s1: false, s2: false };
    setAnnounce("Both systems are working.");
    startRef.current = performance.now();
    tickRef.current = setInterval(() => {
      const t = elapsed();
      if (!doneRef.current.s1) setS1Ms(t);
      if (!doneRef.current.s2) setS2Ms(t);
    }, 50);

    // System 1: one step, on the same beat as System 2's first, answer with it.
    later(STEP_MS, () => {
      setS1Step(1);
      doneRef.current.s1 = true;
      setS1Ms(elapsed());
      setS1Done(true);
      setAnnounce(`System 1: ${run.fast.prompt} is ${run.fast.answer}. System 2 is still working.`);
    });

    // System 2: one step per beat, in parallel.
    for (let i = 1; i < steps; i++) later(i * STEP_MS, () => setS2Step(i));
    later(steps * STEP_MS, () => {
      setS2Step(steps);
      doneRef.current.s2 = true;
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      setS2Ms(elapsed());
      setS2Done(true);
      setRunning(false);
      setAnnounce(`System 2: worked out in ${steps} steps. ${run.slow.prompt} is ${run.slow.answer}.`);
    });
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
      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* The intro is a grid row of its own so its citation can sit beside it. */}
        <div className="flex flex-col gap-3">
          <p className="text-lg text-ink-muted">
            Your mind runs two systems.
            <Cite n={REF.kahneman} /> <strong className="text-ink">System 1</strong> is fast,
            automatic, and effortless. <strong className="text-ink">System 2</strong> is slow,
            deliberate, and effortful.
            <Cite n={REF.stanovich} /> Each is important in its own way, and neither can replace the
            other.
          </p>
          <p className="text-sm text-ink-muted">
            <strong className="text-ink">Caveat:</strong> System 1/System 2 is a metaphor for compute
            regimes, not a claim about cognition or about transformer internals.
          </p>
        </div>
        <Note kicker="References" flush>
          <RefItem
            n={REF.kahneman}
            href="https://en.wikipedia.org/wiki/Thinking,_Fast_and_Slow"
          >
            Daniel Kahneman, <em>Thinking, Fast and Slow</em> (2011).
          </RefItem>
          <RefItem n={REF.stanovich} href="https://doi.org/10.1017/S0140525X00003435">
            Stanovich &amp; West, &ldquo;Individual Differences in Reasoning: Implications for the
            Rationality Debate?&rdquo; (<em>Behavioral and Brain Sciences</em>, 2000). The source
            of the System 1 / System 2 names.
          </RefItem>
        </Note>

        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Meet your two systems</h2>
          <p className="leading-relaxed text-ink">
            Let&apos;s take the example of multiplication to illustrate the two systems.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {/* System 1 — fast */}
            <section aria-label="System 1" className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-compute">System 1 · fast</h3>
                <span role="timer" aria-label="System 1 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                  {started ? fmt(s1Ms) : "not started"}
                </span>
              </div>
              <p className="font-mono text-3xl text-ink">{ex.fast.prompt}</p>
              {/* System 1's whole workings: one step, in the same slot where
                  System 2 stacks three, so the counts sit side by side. */}
              <ol className="flex flex-col gap-1.5 font-mono text-sm text-ink">
                {s1Step >= 1 ? (
                  <li className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs uppercase tracking-wide text-ink-muted">Step #1</span>
                    <span>
                      {ex.fast.prompt} = {ex.fast.answer}
                    </span>
                  </li>
                ) : (
                  <StepSlot />
                )}
                {/* Blank rows hold the height of System 2's extra steps, so the two
                    panels keep the same vertical rhythm. */}
                {ex.slow.steps.slice(1).map((_, i) => (
                  <StepSlot key={`spacer-${i}`} />
                ))}
              </ol>
              {/* The answer slot keeps its height before the reveal, so the panels do not jump. */}
              <p
                className={`mt-auto font-mono text-5xl font-bold tabular-nums text-compute ${s1Done ? "" : "invisible"}`}
                aria-hidden={!s1Done}
              >
                {ex.fast.answer}
              </p>
            </section>

            {/* System 2 — slow */}
            <section aria-label="System 2" className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-wrong">System 2 · slow</h3>
                <span role="timer" aria-label="System 2 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                  {started ? fmt(s2Ms) : "not started"}
                </span>
              </div>
              <p className="font-mono text-3xl text-ink">{ex.slow.prompt}</p>
              <ol className="flex flex-col gap-1.5 font-mono text-sm text-ink">
                {/* Every row is laid out from the start, so the widget never grows. */}
                {ex.slow.steps.map((line, i) =>
                  i < s2Step ? (
                    <li key={i} className="flex flex-wrap items-baseline gap-2">
                      <span className="text-xs uppercase tracking-wide text-ink-muted">
                        Step #{i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ) : (
                    <StepSlot key={i} />
                  ),
                )}
              </ol>
              <p
                className={`mt-auto font-mono text-5xl font-bold tabular-nums text-wrong ${s2Done ? "" : "invisible"}`}
                aria-hidden={!s2Done}
              >
                {ex.slow.answer}
              </p>
            </section>
          </div>
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={!started}
              aria-label="Reset"
              title="Reset"
              className="rounded bg-wrong p-2 text-canvas hover:opacity-90 disabled:opacity-50"
            >
              {/* counter-clockwise arrow */}
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <path d="M3 4v5h5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={calculate}
              disabled={running}
              className="w-fit rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
            >
              {running ? "Calculating…" : "Calculate"}
            </button>
          </div>
          <p className="leading-relaxed text-ink">
            {ex.fast.prompt} is familiar, so <strong>System 1</strong> recognizes the answer
            instantly. {ex.slow.prompt} is not, so <strong>System 2</strong> has to build it step by step, and that takes time.
            For a typical person, it takes far longer than the {(nSteps * STEP_MS) / 1000} seconds
            shown here.
          </p>
        </section>
        <Note kicker="Try it">
          <p>Press Calculate again for a new example, or the arrow to replay the same one.</p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Sort six of your own</h2>
          <SystemSort />
        </section>
        <Note kicker="Sort it">
          <p>Drag a chip into a system, or select it and press &ldquo;Place here.&rdquo;</p>
          <p>Correct drops are green, and wrong drops show up as red.</p>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The difference</h2>
          <p className="leading-relaxed text-ink">
            <strong>System 1</strong> recognizes or reacts as things happen, by reflex.{" "}
            <strong>System 2</strong> spends more time to solve a problem you cannot recognize
            instantly. System 2 scales its effort with the problem, spending more time on harder ones
            to get them right.
          </p>
          {/* The hand-off: hints at training (what you have learned) versus
              inference-time scaling (how long you think) without naming either. */}
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            Sometimes it is worth waiting for a more reliable answer than a quick one. People switch to
            System 2 when a problem is long or unfamiliar, and it is usually worth the wait.
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
