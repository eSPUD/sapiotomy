"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;

// Authored worked solution with a slip on one step (illustrative).
const SOLUTION: { text: string; ok: boolean }[] = [
  { text: "Let the two numbers be x and y with x + y = 20.", ok: true },
  { text: "Also x − y = 4, so 2x = 24 and x = 12.", ok: true },
  { text: "Then y = 20 − 12 = 8.", ok: true },
  { text: "So x · y = 12 · 8 = 108.", ok: false }, // slip: 12·8 = 96, not 108
];

export function Page9() {
  const page = getPage(PAGE_N)!;
  const data = curves.prmVsOrm;
  const { majority, orm, prm } = data.fit!.params;
  const [processView, setProcessView] = useState(true);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const bars = [
    { label: "Majority vote", value: majority, tone: "bg-grid" },
    { label: "Outcome RM (ORM)", value: orm, tone: "bg-compute" },
    { label: "Process RM (PRM)", value: prm, tone: "bg-correct" },
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
        A verifier can grade two ways. An <strong>outcome</strong> reward model checks only the final
        answer. A <strong>process</strong> reward model checks <em>every step</em> — catching a slip
        the moment it happens. On MATH, grading the steps wins.
      </p>

      <Toggle
        label="Grading style"
        checked={processView}
        offLabel="Outcome (final only)"
        onLabel="Process (every step)"
        onChange={(v) => {
          setProcessView(v);
          recordInteraction(PAGE_N);
        }}
      />

      <ol className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
        {SOLUTION.map((step, i) => {
          const isLast = i === SOLUTION.length - 1;
          const showLabel = processView || isLast;
          return (
            <li key={i} className="flex items-center justify-between gap-3 font-mono text-sm">
              <span className="text-ink">
                {i + 1}. {step.text}
              </span>
              {showLabel ? (
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                    step.ok ? "bg-correct/20 text-correct" : "bg-wrong/20 text-wrong"
                  }`}
                >
                  {step.ok ? "step ok" : "error"}
                </span>
              ) : (
                <span className="shrink-0 text-xs text-ink-muted">—</span>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-ink-muted">
        {processView
          ? "Process view flags the exact line that went wrong — a much richer signal for selecting solutions."
          : "Outcome view sees only the final answer, so it can't tell a lucky-but-flawed solution from a sound one."}
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink">Best-of-N accuracy on MATH</p>
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-sm">
            <span className="w-40 shrink-0 text-ink-muted">{b.label}</span>
            <div className="h-5 flex-1 rounded bg-surface-raised">
              <div className={`h-5 rounded ${b.tone}`} style={{ width: `${b.value}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right font-mono text-ink">{b.value}%</span>
          </div>
        ))}
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
