"use client";

import { useState } from "react";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { MENTAL_MATH } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 1;

function ProblemCard({ index }: { index: number }) {
  const problem = MENTAL_MATH[index];
  const [deliberate, setDeliberate] = useState(false);
  const recordInteraction = useStore((s) => s.recordInteraction);
  const accuracy = Math.round((deliberate ? problem.slowAccuracy : problem.fastAccuracy) * 100);

  return (
    <div className={`flex flex-col gap-3 rounded-lg border border-grid p-4 ${deliberate ? "bg-surface" : "bg-surface-raised"}`}>
      <p className="font-mono text-2xl text-ink">{problem.prompt} = ?</p>
      <Toggle
        label="Mode"
        checked={deliberate}
        offLabel="Blurt it (fast)"
        onLabel="Work it out (slow)"
        onChange={(v) => {
          setDeliberate(v);
          recordInteraction(PAGE_N);
        }}
      />
      <div>
        <div className="mb-1 flex justify-between text-sm text-ink-muted">
          <span>Likely to be right</span>
          <span className="font-mono text-ink">{accuracy}%</span>
        </div>
        <div className="h-3 w-full rounded bg-surface-raised">
          <div
            className={`h-3 rounded ${accuracy >= 50 ? "bg-correct" : "bg-wrong"}`}
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>
      <p className="text-sm text-ink-muted">
        {problem.kind === "system1"
          ? "Easy enough to answer by reflex — working it out changes little."
          : "Too many steps for reflex. Taking time to work it out rescues the answer."}
      </p>
    </div>
  );
}

export function Page1() {
  const page = getPage(PAGE_N)!;
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
        Your mind has two gears. <strong>Fast</strong> thinking answers &ldquo;2 + 2&rdquo; instantly.
        <strong> Slow</strong> thinking is what you switch into for &ldquo;17 × 24&rdquo;. Flip each
        problem&apos;s gear and watch how much the extra thinking buys.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <ProblemCard index={0} />
        <ProblemCard index={1} />
      </div>
      <p className="text-xs italic text-ink-muted">
        Illustrative example (hand-authored), after Kahneman&apos;s System 1 / System 2.
      </p>
      <PageNav n={PAGE_N} />
    </article>
  );
}
