"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { inverseU } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 17;
const LENGTHS = Array.from({ length: 13 }, (_, i) => i);

export function Page17() {
  const page = getPage(PAGE_N)!;
  const data = curves.overthinking;
  const { easyPeak, hardPeak, easyPeakAcc, hardPeakAcc, curvature } = data.fit!.params;
  const [length, setLength] = useState(3);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const easyCurve = LENGTHS.map((l) => ({ x: l, y: inverseU(l, easyPeak, easyPeakAcc, curvature) }));
  const hardCurve = LENGTHS.map((l) => ({ x: l, y: inverseU(l, hardPeak, hardPeakAcc, curvature) }));
  const easyNow = inverseU(length, easyPeak, easyPeakAcc, curvature);
  const overthinkingEasy = length > easyPeak;

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
        Everything so far said &ldquo;more thinking helps.&rdquo; Here&apos;s the reversal. Push the
        thinking length too far and accuracy <strong>peaks, then falls</strong> — the model talks
        itself out of the right answer. Easy problems hit that overthinking threshold first.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Thinking length"
            min={0}
            max={12}
            value={length}
            onChange={(v) => {
              setLength(v);
              recordInteraction(PAGE_N);
            }}
          />
          <div className={`rounded-lg border p-4 ${overthinkingEasy ? "border-wrong bg-wrong/10" : "border-grid bg-surface"}`}>
            <p className="text-sm text-ink-muted">Easy-problem accuracy at this length:</p>
            <p className={`font-mono text-3xl ${overthinkingEasy ? "text-wrong" : "text-correct"}`}>
              {easyNow.toFixed(0)}%
            </p>
            <p className="mt-1 text-sm">
              {overthinkingEasy ? (
                <span className="text-wrong">Overthinking zone — past the peak, accuracy is falling.</span>
              ) : (
                <span className="text-ink-muted">Still climbing toward the peak at length {easyPeak}.</span>
              )}
            </p>
          </div>
          <p className="text-sm text-ink-muted">
            The easy curve peaks at length {easyPeak}; the hard curve holds on until {hardPeak}.
          </p>
        </div>
        <LineChart
          title="Accuracy versus thinking length: an inverse-U (easy peaks earlier than hard)"
          points={easyCurve}
          secondary={{ points: hardCurve, label: "hard problems" }}
          primaryLabel="easy problems"
          xLabel="thinking length"
          yLabel="accuracy (%)"
          yDomain={[0, 90]}
          xDomain={[0, 12]}
          markerX={length}
        />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
