"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { logLinearCoverage } from "@/lib/search";
import { useStore } from "@/store/useStore";

const PAGE_N = 11;
const BUDGETS = [1, 2, 5, 10, 25, 50, 100, 175, 250];

export function Page11() {
  const page = getPage(PAGE_N)!;
  const data = curves.coverageScaling;
  const { intercept, slopePerDecade, singleSampleSota } = data.fit!.params;
  const [samples, setSamples] = useState(1);
  const [logX, setLogX] = useState(false);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const curve = BUDGETS.map((k) => ({ x: k, y: logLinearCoverage(k, intercept, slopePerDecade) }));
  const coverage = logLinearCoverage(samples, intercept, slopePerDecade);

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
        Here is an inference-time <strong>scaling law</strong>. On SWE-bench Lite, the fraction of
        problems solved by <em>some</em> sample climbs from 15.9% (one try) to 56% (250 tries) —
        beating the single-sample state of the art of {singleSampleSota}%. Flip the x-axis to a log
        scale and the curve straightens into a line: each <em>doubling</em> buys a roughly constant
        bump.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Samples (k)"
            min={1}
            max={250}
            value={samples}
            suffix=" samples"
            onChange={(v) => {
              setSamples(v);
              recordInteraction(PAGE_N);
            }}
          />
          <Toggle
            label="X-axis scale"
            checked={logX}
            offLabel="Linear"
            onLabel="Logarithmic"
            onChange={(v) => {
              setLogX(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber value={coverage} suffix="%" tone="correct" label={`coverage at ${samples} sample${samples === 1 ? "" : "s"}`} />
          <p className="text-sm text-ink-muted">
            On a log axis this is a straight line — the signature of log-linear scaling.
          </p>
        </div>
        <LineChart
          title="Coverage versus samples on SWE-bench Lite (toggle log axis to straighten it)"
          points={curve}
          xLabel={logX ? "samples (log scale)" : "samples"}
          yLabel="coverage (%)"
          yDomain={[0, 60]}
          xDomain={[1, 250]}
          markerX={samples}
          referenceY={singleSampleSota}
          referenceLabel={`single-sample SOTA ${singleSampleSota}%`}
          logX={logX}
        />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
