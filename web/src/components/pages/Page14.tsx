"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { allocationScore, optimalAllocation, type Allocation } from "@/lib/search";
import { useStore } from "@/store/useStore";

const PAGE_N = 14;
const TOTAL = 10;

export function Page14() {
  const page = getPage(PAGE_N)!;
  const data = curves.computeOptimal;
  const { efficiencyVsBestOfN, largerModelFactor } = data.fit!.params;
  const [easy, setEasy] = useState(3);
  const [medium, setMedium] = useState(3);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const hard = Math.max(0, TOTAL - easy - medium);
  const alloc: Allocation = { easy, medium, hard };
  const optimal = optimalAllocation(TOTAL);
  const yourScore = allocationScore(alloc) * 100;
  const optimalScore = allocationScore(optimal) * 100;

  const applyOptimal = () => {
    setEasy(optimal.easy);
    setMedium(optimal.medium);
    recordInteraction(PAGE_N);
  };

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
        You have a fixed thinking budget of {TOTAL} units. Spend it across easy, medium, and hard
        problems to maximise overall accuracy. Easy problems barely need it; hopeless-hard ones
        waste it; the <strong>medium</strong> band is where thinking pays. Match the budget to the
        difficulty.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider label="Budget on EASY problems" min={0} max={TOTAL} value={easy}
            onChange={(v) => { setEasy(Math.min(v, TOTAL)); recordInteraction(PAGE_N); }} />
          <Slider label="Budget on MEDIUM problems" min={0} max={TOTAL - easy} value={Math.min(medium, TOTAL - easy)}
            onChange={(v) => { setMedium(v); recordInteraction(PAGE_N); }} />
          <p className="text-sm text-ink-muted">
            Hard problems get the remaining <span className="font-mono text-ink">{hard}</span> unit
            {hard === 1 ? "" : "s"} (total spent: {easy + medium + hard}/{TOTAL}).
          </p>
          <button type="button" onClick={applyOptimal} className="w-fit rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas">
            Show the compute-optimal policy
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-around rounded-lg border border-grid bg-surface p-4">
            <BigNumber value={yourScore} suffix="%" tone={yourScore >= optimalScore - 0.5 ? "correct" : "compute"} label="your accuracy" />
            <BigNumber value={optimalScore} suffix="%" tone="ink" label="compute-optimal" />
          </div>
          <div className="rounded border border-grid bg-surface p-3 text-sm text-ink-muted">
            Snell et al. found a compute-optimal, difficulty-adaptive strategy is{" "}
            <strong className="text-correct">&gt;{efficiencyVsBestOfN}× more efficient</strong> than
            best-of-N — and, FLOPs-matched, can beat a{" "}
            <strong className="text-correct">{largerModelFactor}× larger model</strong>.
          </div>
        </div>
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
