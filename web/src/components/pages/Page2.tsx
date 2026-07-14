"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;

export function Page2() {
  const page = getPage(PAGE_N)!;
  const cot = curves.chainOfThought;
  const baseline = cot.points.find((p) => p.x === 0)!.y; // 17.9%
  const [revealed, setRevealed] = useState(false);
  const recordInteraction = useStore((s) => s.recordInteraction);

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
        A language model writes its answer one token at a time, with no scratch space. Force it to
        blurt the final answer to a grade-school word problem — no working shown — and it mostly
        fails.
      </p>

      <blockquote className="rounded-lg border-l-4 border-grid bg-surface p-4 text-ink">
        &ldquo;Natalia sold clips to 48 friends in April, then half as many in May. How many clips
        did she sell altogether?&rdquo;
      </blockquote>

      <div className="flex flex-col items-center gap-4 rounded-lg border border-grid bg-surface p-6">
        {revealed ? (
          <BigNumber value={baseline} suffix="%" tone="wrong" label="answered correctly (GSM8K, standard prompting, PaLM-540B)" />
        ) : (
          <button
            type="button"
            onClick={() => {
              setRevealed(true);
              recordInteraction(PAGE_N);
            }}
            className="rounded bg-compute px-5 py-2.5 font-semibold text-canvas"
          >
            Make the model answer immediately
          </button>
        )}
      </div>

      <div>
        <CitationBadge citation={cot.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
