"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LiveDemo } from "@/components/LiveDemo";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;
const MAX_PRESSES = 5;
const THOUGHTS = [
  "The three numbers are 6, 6, and 24…",
  "Wait — let me re-check that multiplication.",
  "Wait — actually 6 × 4 = 24, so I need a 4.",
  "Wait — 6 / (1 − 3/4) = 24. That works.",
  "Wait — let me confirm each operation once more.",
  "Final answer: (6 ÷ (1 − 3 ÷ 4)) = 24. ✓",
];

export function Page15() {
  const page = getPage(PAGE_N)!;
  const data = curves.budgetForcing;
  const flipAt = data.fit!.params.flipAtPress;
  const [presses, setPresses] = useState(0);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const accuracy = interpolate(data, presses);
  const solved = presses >= flipAt;

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
        The simplest modern trick: when the model tries to stop, make it keep going by appending the
        word <strong>&ldquo;Wait&rdquo;</strong>. Each nudge forces another reconsideration — and the
        answer sometimes flips from wrong to right.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <button
            type="button"
            disabled={presses >= MAX_PRESSES}
            onClick={() => {
              setPresses((n) => Math.min(MAX_PRESSES, n + 1));
              recordInteraction(PAGE_N);
            }}
            className="w-fit rounded bg-compute px-6 py-3 text-lg font-bold text-canvas disabled:opacity-50"
          >
            Wait
          </button>
          <BigNumber value={accuracy} suffix="%" tone={solved ? "correct" : "wrong"} label={`AIME24 accuracy (s1-32B) after ${presses} "Wait"${presses === 1 ? "" : "s"}`} />
          <p className={`text-sm font-semibold ${solved ? "text-correct" : "text-wrong"}`}>
            Current answer: {solved ? "24 ✓ (correct)" : "18 ✗ (still wrong — keep it thinking)"}
          </p>
        </div>
        <div className="rounded-lg border border-grid bg-surface p-4">
          <p className="mb-2 text-sm text-ink-muted">The reasoning trace grows with each press:</p>
          <ol className="flex flex-col gap-2 font-mono text-sm">
            {THOUGHTS.slice(0, presses + 1).map((t, i) => (
              <li key={i} className={t.startsWith("Wait") ? "text-compute" : "text-ink"}>
                {t}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <LiveDemo prompt="Make 24 from the numbers 6, 6, 4 using + - * / . Think step by step, and reconsider with 'Wait' if unsure." fallbackTrace={THOUGHTS} />

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
