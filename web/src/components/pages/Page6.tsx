"use client";

import { useEffect, useMemo, useState } from "react";
import { BallotHistogram } from "@/components/BallotHistogram";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { PredictBar } from "@/components/PredictBar";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useSelfConsistency } from "@/lib/useSelfConsistency";
import { useStore } from "@/store/useStore";

const PAGE_N = 6;
const CURVE_NS = [1, 2, 3, 5, 8, 12, 16, 20, 28, 40];
const TRIALS = 4000;
const SEED = 20220311; // arXiv id of Wang et al. — a stable, documented seed

export function Page6() {
  const page = getPage(PAGE_N)!;
  const [votes, setVotes] = useState(1);
  const [prediction, setPrediction] = useState<number | null>(null);
  const recordInteraction = useStore((s) => s.recordInteraction);
  const { result, request } = useSelfConsistency();

  // Recompute whenever the vote budget changes.
  useEffect(() => {
    request({ kind: "selfConsistency", ns: CURVE_NS, currentN: votes, trials: TRIALS, seed: SEED });
  }, [votes, request]);

  const curve = result?.curve ?? [{ x: 1, y: 56.5 }];
  const ballot = result?.ballot ?? { tally: [1, 0, 0, 0], winner: 0, correctIsPlurality: true };
  const currentAccuracy = useMemo(() => {
    const c = result?.curve ?? [{ x: 1, y: 56.5 }];
    const nearest = c.reduce((best, p) =>
      Math.abs(p.x - votes) < Math.abs(best.x - votes) ? p : best,
    );
    return nearest.y;
  }, [result, votes]);

  const anchor = curves.selfConsistency;

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
        One chain of thought can slip. So ask the model the <em>same</em> question many times, let
        each attempt reason independently, and go with the answer that comes up most often — like
        polling a class and taking the plurality. This is <strong>self-consistency</strong>.
      </p>

      {prediction === null ? (
        <PredictBar
          prompt="Single-chain reasoning gets 56.5% on GSM8K. If you take the majority vote over 40 tries, what accuracy do you predict?"
          min={40}
          max={100}
          suffix="%"
          onCommit={(p) => {
            setPrediction(p);
            setVotes(40);
            recordInteraction(PAGE_N);
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <Slider
              label="Votes (independent attempts)"
              min={1}
              max={40}
              value={votes}
              suffix=" votes"
              onChange={(v) => {
                setVotes(v);
                recordInteraction(PAGE_N);
              }}
            />
            <BigNumber value={currentAccuracy} suffix="%" tone="correct" label={`majority accuracy at ${votes} vote${votes === 1 ? "" : "s"}`} />
            <div>
              <p className="mb-2 text-sm text-ink-muted">A representative question&apos;s tally:</p>
              <BallotHistogram ballot={ballot} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <LineChart
              title="Majority-vote accuracy versus number of votes on GSM8K"
              points={curve}
              xLabel="votes (samples)"
              yLabel="accuracy (%)"
              yDomain={[50, 80]}
              xDomain={[1, 40]}
              markerX={votes}
              referenceY={prediction}
              referenceLabel={`you predicted ${prediction}%`}
            />
            <p className="text-sm text-ink-muted">
              The gain is real but flattens — <strong>diminishing returns</strong>. Wang et al. report
              self-consistency lifts GSM8K by <strong>+17.9 points</strong> (56.5% → 74.4%).
            </p>
          </div>
        </div>
      )}

      <div className="mt-2">
        <CitationBadge citation={anchor.citation} />
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
