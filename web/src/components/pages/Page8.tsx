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
import { coverageAtLeastOne } from "@/lib/sim";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const BUDGETS = [1, 5, 10, 20, 40, 80, 150, 300];

export function Page8() {
  const page = getPage(PAGE_N)!;
  const data = curves.votingPlateau;
  const p = data.fit!.params.coveragePerSample; // 0.2
  const [samples, setSamples] = useState(40);
  const [showCoverage, setShowCoverage] = useState(true);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const majorityCurve = BUDGETS.map((n) => ({ x: n, y: interpolate(data, n) }));
  const coverageCurve = BUDGETS.map((n) => ({ x: n, y: coverageAtLeastOne(p, n) * 100 }));

  const majorityNow = interpolate(data, samples);
  const coverageNow = coverageAtLeastOne(p, samples) * 100;
  const readout = showCoverage ? coverageNow : majorityNow;

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
        Push the vote count past a few dozen and something frustrating happens. The chance that{" "}
        <em>some</em> sample is correct (<strong className="text-correct">coverage</strong>) keeps
        climbing — but the <strong className="text-compute">majority-correct</strong> line flattens.
        Having a right answer in the pile isn&apos;t the same as <em>picking</em> it.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Samples"
            min={1}
            max={300}
            value={samples}
            suffix=" samples"
            onChange={(v) => {
              setSamples(v);
              recordInteraction(PAGE_N);
            }}
          />
          <Toggle
            label="Readout"
            checked={showCoverage}
            offLabel="Majority correct"
            onLabel="Coverage (any correct)"
            onChange={(v) => {
              setShowCoverage(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber
            value={readout}
            suffix="%"
            tone={showCoverage ? "correct" : "compute"}
            label={showCoverage ? `coverage at ${samples} samples` : `majority correct at ${samples} samples`}
          />
          <p className="text-sm text-ink-muted">
            Without an automatic verifier, majority voting and reward-model selection{" "}
            <strong>plateau beyond several hundred samples</strong> and fail to fully scale.
          </p>
        </div>
        <LineChart
          title="Coverage keeps rising while majority-correct accuracy plateaus"
          points={coverageCurve}
          secondary={{ points: majorityCurve, label: "majority correct" }}
          primaryLabel="coverage"
          xLabel="samples"
          yLabel="accuracy (%)"
          yDomain={[50, 100]}
          xDomain={[1, 300]}
          markerX={samples}
        />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
