"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { TRACE_BANK, TRACE_BANK_STAT } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;

export function Page4() {
  const page = getPage(PAGE_N)!;
  const [seen, setSeen] = useState<number[]>([0]);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const resample = () => {
    setSeen((prev) => [...prev, (prev[prev.length - 1] + 1) % TRACE_BANK.length]);
    recordInteraction(PAGE_N);
  };

  const shown = seen.map((i) => TRACE_BANK[i]);
  const failedAfterStep1 = shown.filter((t) => t.failsAfterFirstStep).length;
  const pct = Math.round((failedAfterStep1 / shown.length) * 100);
  const current = TRACE_BANK[seen[seen.length - 1]];

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
        Showing your work helps — but a single chain is fragile. One slip on an early line dooms the
        rest. The model is stochastic, so the <em>same</em> question can produce very different
        chains. Resample and watch.
      </p>

      <div className="rounded-lg border border-grid bg-surface p-4">
        <ol className="flex flex-col gap-2">
          {current.steps.map((s, i) => {
            const isBadStep = !current.correct && i > 0;
            return (
              <li key={i} className="flex items-start gap-2 font-mono text-sm">
                <span className={`mt-0.5 ${isBadStep ? "text-wrong" : "text-ink-muted"}`}>
                  {i + 1}.
                </span>
                <span className="text-ink">{s}</span>
              </li>
            );
          })}
        </ol>
        <p className={`mt-3 text-sm font-semibold ${current.correct ? "text-correct" : "text-wrong"}`}>
          {current.correct ? "✓ Correct chain" : "✗ Wrong chain (slipped after the first step)"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={resample}
          className="rounded bg-compute px-4 py-2 font-semibold text-canvas"
        >
          Resample this question
        </button>
        <p className="text-sm text-ink-muted">
          Of the <strong>{shown.length}</strong> chains you&apos;ve drawn,{" "}
          <strong className="text-wrong">{pct}%</strong> went wrong after their first step.
        </p>
      </div>

      <p className="max-w-2xl text-sm text-ink-muted">
        This variance is exactly what the next Act exploits: if any single chain is unreliable, ask
        many and combine them. Yao et al. found <strong>more than 60%</strong> of chain-of-thought
        &ldquo;thoughts&rdquo; failed after their first step.
      </p>

      <div>
        <CitationBadge citation={TRACE_BANK_STAT.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
