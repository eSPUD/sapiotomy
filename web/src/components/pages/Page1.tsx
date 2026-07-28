"use client";

import { useEffect, useRef, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { SystemSort } from "@/components/pages/SystemSort";
import { ACTS, getPage } from "@/lib/pages";
import { SYSTEMS } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 1;

/** Page 1's references, numbered in order of first appearance. */
const REF = { kahneman: 1 } as const;
const fmt = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

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

export function Page1() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  // System 1: one tap reveals the product.
  const [s1Revealed, setS1Revealed] = useState(false);

  // System 2: tap through the steps; a stopwatch runs across the taps.
  const [s2Step, setS2Step] = useState(0);
  const [s2Ms, setS2Ms] = useState(0);
  const s2StartRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [announce, setAnnounce] = useState("");
  const s2Done = s2Step >= SYSTEMS.slow.steps.length;

  useEffect(
    () => () => {
      if (tickRef.current) clearInterval(tickRef.current);
    },
    [],
  );

  const revealS1 = () => {
    if (s1Revealed) return;
    setS1Revealed(true);
    recordInteraction(PAGE_N);
    setAnnounce(`System 1: ${SYSTEMS.fast.prompt} is ${SYSTEMS.fast.answer}. Instant.`);
  };

  const nextS2 = () => {
    if (s2Done) return;
    if (s2Step === 0) {
      s2StartRef.current = performance.now();
      recordInteraction(PAGE_N);
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = setInterval(() => {
        if (s2StartRef.current != null) setS2Ms(performance.now() - s2StartRef.current);
      }, 100);
    }
    const next = s2Step + 1;
    setS2Step(next);
    if (next >= SYSTEMS.slow.steps.length) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (s2StartRef.current != null) setS2Ms(performance.now() - s2StartRef.current);
      setAnnounce(`System 2: worked out in ${SYSTEMS.slow.steps.length} steps. ${SYSTEMS.slow.prompt} is ${SYSTEMS.slow.answer}.`);
    }
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
        <p className="max-w-2xl text-lg text-ink-muted">
          Your mind runs two systems. <strong className="text-ink">System 1</strong> is fast,
          automatic, effortless. <strong className="text-ink">System 2</strong> is slow, deliberate,
          effortful.
          <Cite n={REF.kahneman} /> One operation, multiplication, flips you between them.
        </p>
        <Note kicker="References" flush>
          <RefItem n={REF.kahneman}>
            Daniel Kahneman, <em>Thinking, Fast and Slow</em> (2011).
          </RefItem>
        </Note>

        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Meet the two systems</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {/* System 1 — fast */}
            <section aria-label="System 1" className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-compute">System 1 · fast</h3>
                <span role="timer" aria-label="System 1 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                  {s1Revealed ? "instant" : "not started"}
                </span>
              </div>
              <p className="font-mono text-3xl text-ink">{SYSTEMS.fast.prompt}</p>
              {/* System 1's whole workings: one step, in the same slot where
                  System 2 stacks three, so the counts sit side by side. */}
              <ol className="flex flex-col gap-1.5 font-mono text-sm text-ink">
                {s1Revealed ? (
                  <li className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs uppercase tracking-wide text-ink-muted">Step #1</span>
                    <span>
                      {SYSTEMS.fast.prompt} = {SYSTEMS.fast.answer}
                    </span>
                  </li>
                ) : null}
                {/* Two blank rows hold the height of System 2's extra steps, so the
                    two panels keep the same vertical rhythm. Hidden from the a11y
                    tree: they are spacing, not content. */}
                {[0, 1].map((i) => (
                  <li key={`spacer-${i}`} aria-hidden="true" className="invisible">
                    &nbsp;
                  </li>
                ))}
              </ol>
              <div className="mt-auto flex flex-col gap-3">
                {s1Revealed ? (
                  <>
                    <p className="font-mono text-5xl font-bold tabular-nums text-compute">{SYSTEMS.fast.answer}</p>
                    <p className="text-sm text-ink-muted">
                      The answer was already there. You didn&apos;t compute it; you recognized it.
                    </p>
                  </>
                ) : (
                  <button type="button" onClick={revealS1} className="w-fit rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas">
                    It&apos;s obvious
                  </button>
                )}
                <p className="text-xs text-ink-muted">Automatic · Effortless · Recognition, not work</p>
              </div>
            </section>

            {/* System 2 — slow */}
            <section aria-label="System 2" className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-wrong">System 2 · slow</h3>
                <span role="timer" aria-label="System 2 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                  {s2Step === 0 ? "not started" : fmt(s2Ms)}
                </span>
              </div>
              <p className="font-mono text-3xl text-ink">{SYSTEMS.slow.prompt}</p>
              <ol className="flex flex-col gap-1.5 font-mono text-sm text-ink">
                {SYSTEMS.slow.steps.slice(0, s2Step).map((line, i) => (
                  <li key={i} className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xs uppercase tracking-wide text-ink-muted">
                      Step #{i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto flex flex-col gap-3">
                {s2Done ? (
                  <>
                    <p className="font-mono text-5xl font-bold tabular-nums text-wrong">{SYSTEMS.slow.answer}</p>
                    <p className="text-sm text-ink-muted">You built it, line by line. That building is System 2.</p>
                  </>
                ) : (
                  <button type="button" onClick={nextS2} className="w-fit rounded bg-wrong px-4 py-2 text-sm font-semibold text-canvas">
                    {s2Step === 0 ? "Work it out" : "Next step"}
                  </button>
                )}
                <p className="text-xs text-ink-muted">Deliberate · Sequential · You feel every step</p>
              </div>
            </section>
          </div>
        </section>
        <div aria-hidden="true" />

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. Sort six of your own</h2>
          <SystemSort />
        </section>
        <Note kicker="Sort it">
          <p>Drag a chip into a system, or select it and press &ldquo;Place here.&rdquo;</p>
          <p>Correct drops lock in green; wrong ones flash red and bounce back.</p>
        </Note>

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The difference</h2>
          <p className="leading-relaxed text-ink">
            Same operation, two different machines. <strong>System 1</strong> recognizes the answer;{" "}
            <strong>System 2</strong> builds it. One arrives whole, instant, effortless, automatic.
            The other comes line by line, slow, deliberate, and you feel every step. Recognizing an
            answer and constructing one are not the same act.
          </p>
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
