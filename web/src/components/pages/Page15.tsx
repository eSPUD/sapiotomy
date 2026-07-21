"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;

export function Page15() {
  const page = getPage(PAGE_N)!;
  const data = curves.arcCost;
  const { o3LowCost, o3LowAcc, o3HighCost, o3HighAcc, computeFactor, o1Acc, humanCost } = data.fit!.params;
  // log10 dollar slider between the two o3 configs
  const [logCost, setLogCost] = useState(Math.log10(o3LowCost) * 100);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const cost = Math.pow(10, logCost / 100);
  // interpolate accuracy in log-cost space between the two o3 points
  const t = (Math.log10(cost) - Math.log10(o3LowCost)) / (Math.log10(o3HighCost) - Math.log10(o3LowCost));
  const accuracy = o3LowAcc + Math.max(0, Math.min(1, t)) * (o3HighAcc - o3LowAcc);

  const curve = [
    { x: o3LowCost, y: o3LowAcc },
    { x: o3HighCost, y: o3HighAcc },
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
        More thinking isn&apos;t free. To crack ARC-AGI, OpenAI&apos;s o3 went from ~75.7% at roughly
        $17–20 per task to 87.5% using <strong>{computeFactor}× the compute</strong> — costing{" "}
        <em>thousands</em> of dollars per task. A human solves the same puzzle for about ${humanCost}.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Compute spend per task"
            min={Math.round(Math.log10(o3LowCost) * 100)}
            max={Math.round(Math.log10(o3HighCost) * 100)}
            value={logCost}
            onChange={(v) => {
              setLogCost(v);
              recordInteraction(PAGE_N);
            }}
          />
          <div className="flex items-end justify-around rounded-lg border border-grid bg-surface p-4">
            <BigNumber value={accuracy} suffix="%" tone="correct" label="ARC-AGI accuracy" />
            <BigNumber value={cost} decimals={0} suffix=" $/task" tone="compute" label="estimated cost" />
          </div>
          <p className="text-sm text-ink-muted">
            For reference: o1 reached at most ~{o1Acc}%; a human ≈ ${humanCost}/task.
          </p>
          <p className="text-xs italic text-ink-muted">
            These dollar figures are <strong>reported estimates</strong>, not precise measurements
            (the ARC Prize Foundation revised the high-compute figure from ~$3,000 toward ~$30,000
            per task). Presented as reported.
          </p>
        </div>
        <LineChart
          title="ARC-AGI accuracy versus estimated dollar cost per task (log scale)"
          points={curve}
          xLabel="$ per task (log scale)"
          yLabel="accuracy (%)"
          yDomain={[60, 100]}
          xDomain={[o3LowCost, o3HighCost]}
          logX
        />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
