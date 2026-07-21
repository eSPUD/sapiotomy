"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { coverageAtLeastOne, sampleGrid } from "@/lib/sim";
import { useStore } from "@/store/useStore";

const PAGE_N = 4;
const P_SINGLE = 0.35; // illustrative single-attempt success rate
const SEED = 424242;

export function Page4() {
  const page = getPage(PAGE_N)!;
  const [attempts, setAttempts] = useState(1);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const grid = sampleGrid(P_SINGLE, attempts, SEED);
  const anySolved = grid.some(Boolean);
  const coverage = coverageAtLeastOne(P_SINGLE, attempts) * 100;
  const curve = Array.from({ length: 10 }, (_, i) => ({
    x: i + 1,
    y: coverageAtLeastOne(P_SINGLE, i + 1) * 100,
  }));

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
        If one attempt is unreliable, ask a whole class. Each student (each attempt) succeeds only
        about {Math.round(P_SINGLE * 100)}% of the time — but the chance that <em>at least one</em>{" "}
        gets it right climbs fast. That climbing quantity has a name you&apos;ll meet next:{" "}
        <strong>coverage</strong>.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Attempts"
            min={1}
            max={10}
            value={attempts}
            suffix={attempts === 1 ? " attempt" : " attempts"}
            onChange={(v) => {
              setAttempts(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber value={coverage} suffix="%" tone={anySolved ? "correct" : "wrong"} label="chance at least one attempt is correct" />
          <div>
            <p className="mb-2 text-sm text-ink-muted">The class ({attempts} attempt{attempts === 1 ? "" : "s"}):</p>
            <div className="flex flex-wrap gap-2" role="img" aria-label={`${grid.filter(Boolean).length} of ${attempts} attempts correct`}>
              {grid.map((ok, i) => (
                <span
                  key={i}
                  title={ok ? "correct" : "wrong"}
                  className={`flex h-8 w-8 items-center justify-center rounded text-sm ${
                    ok ? "bg-correct text-canvas" : "bg-surface-raised text-ink-muted"
                  }`}
                >
                  {ok ? "✓" : "·"}
                </span>
              ))}
            </div>
          </div>
        </div>
        <LineChart
          title="Coverage (chance at least one is correct) versus number of attempts"
          points={curve}
          xLabel="attempts"
          yLabel="coverage (%)"
          yDomain={[0, 100]}
          xDomain={[1, 10]}
          markerX={attempts}
        />
      </div>
      <p className="text-xs italic text-ink-muted">
        Client-side simulation: coverage = 1 − (1 − p)<sup>n</sup>, with p ≈ {P_SINGLE}.
      </p>
      <PageNav n={PAGE_N} />
    </article>
  );
}
