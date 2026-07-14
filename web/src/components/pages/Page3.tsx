"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { PredictBar } from "@/components/PredictBar";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 3;

const WORKED_STEPS = [
  "In April she sold 48 clips.",
  "In May she sold half as many: 48 ÷ 2 = 24.",
  "Altogether: 48 + 24 = 72.",
];

export function Page3() {
  const page = getPage(PAGE_N)!;
  const cot = curves.chainOfThought;
  const standard = cot.points.find((p) => p.x === 0)!.y; // 17.9
  const withCot = cot.points.find((p) => p.x === 1)!.y; // 56.9
  const [showWork, setShowWork] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [stepsShown, setStepsShown] = useState(0);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const accuracy = showWork ? withCot : standard;

  if (prediction === null) {
    return (
      <article className="flex flex-col gap-5">
        <Header page={page} />
        <PredictBar
          prompt="Standard prompting gets 17.9% on GSM8K. If you let the model show its work (chain-of-thought), what accuracy do you predict?"
          min={17}
          max={100}
          suffix="%"
          onCommit={(p) => {
            setPrediction(p);
            setShowWork(true);
            recordInteraction(PAGE_N);
          }}
        />
        <PageNav n={PAGE_N} />
      </article>
    );
  }

  return (
    <article className="flex flex-col gap-5">
      <Header page={page} />
      <Toggle
        label="Show your work"
        checked={showWork}
        offLabel="Standard"
        onLabel="Chain-of-thought"
        onChange={(v) => {
          setShowWork(v);
          recordInteraction(PAGE_N);
        }}
      />

      <div className="flex flex-col items-center gap-2 rounded-lg border border-grid bg-surface p-6">
        <BigNumber value={accuracy} suffix="%" tone={showWork ? "correct" : "wrong"} label="GSM8K accuracy (PaLM-540B)" />
        <p className="text-sm text-ink-muted">
          You predicted {prediction}%. Chain-of-thought lifts accuracy by{" "}
          <strong>+{(withCot - standard).toFixed(1)} points</strong>.
        </p>
      </div>

      {showWork ? (
        <div className="rounded-lg border border-grid bg-surface p-4">
          <p className="mb-2 text-sm text-ink-muted">The model&apos;s working, one step at a time:</p>
          <ol className="flex flex-col gap-2">
            {WORKED_STEPS.slice(0, stepsShown).map((s, i) => (
              <li key={i} className="font-mono text-sm text-ink">
                {i + 1}. {s}
              </li>
            ))}
          </ol>
          {stepsShown < WORKED_STEPS.length ? (
            <button
              type="button"
              onClick={() => {
                setStepsShown((n) => n + 1);
                recordInteraction(PAGE_N);
              }}
              className="mt-3 rounded bg-surface-raised px-3 py-1.5 text-sm text-ink"
            >
              Reveal next step
            </button>
          ) : (
            <p className="mt-3 text-sm text-correct">Answer: 72 ✓</p>
          )}
        </div>
      ) : null}

      <div>
        <CitationBadge citation={cot.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}

function Header({ page }: { page: { n: number; title: string; act: 1 | 2 | 3 } }) {
  return (
    <>
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Ask the model to write its reasoning <em>before</em> the answer — &ldquo;show your
        work&rdquo; — and the same model, unchanged, does dramatically better.
      </p>
    </>
  );
}
