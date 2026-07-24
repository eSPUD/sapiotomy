"use client";

import { useEffect, useRef, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { SystemSort } from "@/components/pages/SystemSort";
import { ACTS, getPage } from "@/lib/pages";
import { SYSTEMS } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 1;
const fmt = (ms: number) => `${(ms / 1000).toFixed(1)} s`;

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

      {/* Left = the ordered workflow · Right = instructions + references */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8">
          <p className="text-lg text-ink-muted">
            Your mind runs two systems. <strong className="text-ink">System 1</strong> is fast,
            automatic, effortless. <strong className="text-ink">System 2</strong> is slow,
            deliberate, effortful. One operation, multiplication, flips you between them.
          </p>

          {/* Step 1 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">1. Meet the two systems</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {/* System 1 — fast */}
              <section aria-label="System 1" className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-compute">System 1 · fast</h3>
                  <span role="timer" aria-label="System 1 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                    {s1Revealed ? "instant" : "—"}
                  </span>
                </div>
                <p className="font-mono text-3xl text-ink">{SYSTEMS.fast.prompt}</p>
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
                <p className="mt-auto text-xs text-ink-muted">Automatic · Effortless · Recognition, not work</p>
              </section>

              {/* System 2 — slow */}
              <section aria-label="System 2" className="flex flex-col gap-3 rounded-lg border-l-4 border-wrong bg-surface p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-wrong">System 2 · slow</h3>
                  <span role="timer" aria-label="System 2 time" className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted">
                    {s2Step === 0 ? "—" : fmt(s2Ms)}
                  </span>
                </div>
                <p className="font-mono text-3xl text-ink">{SYSTEMS.slow.prompt}</p>
                <ol className="flex flex-col gap-1 font-mono text-sm text-ink">
                  {SYSTEMS.slow.steps.slice(0, s2Step).map((line, i) => (
                    <li key={i}>
                      <span className="text-ink-muted">{i + 1}. </span>
                      {line}
                    </li>
                  ))}
                </ol>
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
                <p className="mt-auto text-xs text-ink-muted">Deliberate · Sequential · You feel every step</p>
              </section>
            </div>
          </section>

          {/* Step 2 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">2. Sort six of your own</h2>
            <SystemSort />
          </section>

          {/* Step 3 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">3. The difference</h2>
            <div className="max-w-2xl rounded-lg border-l-4 border-ink bg-surface p-4 leading-relaxed text-ink">
              Same operation, two different machines. <strong>System 1</strong> recognizes the
              answer; <strong>System 2</strong> builds it. One arrives whole, instant, effortless,
              automatic. The other comes line by line, slow, deliberate, and you feel every step.
              Recognizing an answer and constructing one are not the same act.
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">How to read this page</h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>Reveal System 1&apos;s answer, then tap through System 2&apos;s steps.</li>
              <li>Sort the six tasks: drag a chip into a system, or select it and press &ldquo;Place here.&rdquo;</li>
              <li>
                Use <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd> to move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">References</h2>
            <p className="text-sm text-ink-muted">
              Daniel Kahneman, <em>Thinking, Fast and Slow</em> (2011).
            </p>
            <p className="text-sm text-ink-muted">
              The examples are hand-authored teaching cases. Timers reflect your own play, not a
              benchmark.
            </p>
          </div>
        </aside>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
