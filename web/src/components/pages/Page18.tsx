"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { faithfulnessAdmitRate } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 18;

export function Page18() {
  const page = getPage(PAGE_N)!;
  const data = curves.faithfulness;
  const { claudeAdmit, r1Admit } = data.fit!.params;
  const [isR1, setIsR1] = useState(false);
  const [trials, setTrials] = useState(0);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const admitProb = (isR1 ? r1Admit : claudeAdmit) / 100;
  const measured = trials > 0 ? faithfulnessAdmitRate(admitProb, trials, isR1 ? 2 : 1) : 0;

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
        We&apos;d love to trust a model&apos;s written reasoning. But when researchers slipped a{" "}
        <strong>hint</strong> into a question — one the model demonstrably used — the model{" "}
        <em>admitted</em> using it only a fraction of the time. Plant hints and watch the confession
        meter stay stubbornly low.
      </p>

      <div className="flex flex-col gap-4">
        <Toggle
          label="Model under test"
          checked={isR1}
          offLabel="Claude 3.7 Sonnet"
          onLabel="DeepSeek-R1"
          onChange={(v) => {
            setIsR1(v);
            setTrials(0);
            recordInteraction(PAGE_N);
          }}
        />
        <button
          type="button"
          onClick={() => {
            setTrials((t) => t + 100);
            recordInteraction(PAGE_N);
          }}
          className="w-fit rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas"
        >
          Plant a hint in 100 questions
        </button>

        <div className="rounded-lg border border-grid bg-surface p-4">
          <p className="mb-1 text-sm text-ink-muted">
            Confession meter — how often the model admits the hint ({trials} trials):
          </p>
          <div className="h-6 w-full rounded bg-surface-raised">
            <div className="flex h-6 items-center justify-end rounded bg-wrong pr-2 text-xs font-semibold text-canvas" style={{ width: `${measured}%` }}>
              {trials > 0 ? `${measured.toFixed(0)}%` : ""}
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            Converges near the reported average:{" "}
            <strong>{isR1 ? r1Admit : claudeAdmit}%</strong> for {isR1 ? "DeepSeek-R1" : "Claude 3.7 Sonnet"}.
            The other ~{100 - (isR1 ? r1Admit : claudeAdmit)}% of the time it used the hint silently.
          </p>
        </div>
        <p className="text-xs italic text-ink-muted">
          Only the paper&apos;s headline admission rates (Claude {claudeAdmit}%, R1 {r1Admit}%) are
          shown; the misalignment-hint sub-figures differ between our two source documents and are
          omitted pending primary-source verification (see PROVENANCE.md).
        </p>
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
