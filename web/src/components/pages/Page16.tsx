"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 16;
const STEPS = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];

export function Page16() {
  const page = getPage(PAGE_N)!;
  const data = curves.deepseekTraining;
  const { cons64, lengthStart, lengthEnd } = data.fit!.params;
  const [step, setStep] = useState(0);
  const [voting, setVoting] = useState(false);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const passAt1 = interpolate(data, step);
  const accuracy = voting ? Math.max(passAt1, cons64 * (step / 8000)) : passAt1;
  const displayAcc = voting && step >= 8000 ? cons64 : accuracy;
  const length = Math.round(lengthStart + (lengthEnd - lengthStart) * (step / 8000));
  const curve = STEPS.map((s) => ({ x: s, y: interpolate(data, s) }));

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
        Reasoning models like DeepSeek-R1 aren&apos;t prompted to think; they&apos;re{" "}
        <strong>trained</strong> to, with reinforcement learning. Scrub through training and watch
        AIME accuracy climb from 15.6% to 71.0% as the model&apos;s answers grow longer.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="RL training step"
            min={0}
            max={8000}
            step={500}
            value={step}
            onChange={(v) => {
              setStep(v);
              recordInteraction(PAGE_N);
            }}
          />
          <Toggle
            label="Add majority voting (cons@64)"
            checked={voting}
            onChange={(v) => {
              setVoting(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber value={displayAcc} suffix="%" tone="correct" label={voting ? "AIME'24 with cons@64" : "AIME'24 pass@1"} />
          <p className="text-sm text-ink-muted">
            Reasoning length ≈ <span className="font-mono text-ink">{length}</span> tokens.{" "}
            {voting && step >= 8000 ? "cons@64 reaches 86.7%, matching OpenAI-o1-0912." : "Accuracy and thinking length climb together."}
          </p>
        </div>
        <LineChart
          title="DeepSeek-R1-Zero AIME'24 pass@1 across RL training"
          points={curve}
          xLabel="training step"
          yLabel="pass@1 (%)"
          yDomain={[0, 90]}
          xDomain={[0, 8000]}
          markerX={step}
        />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
