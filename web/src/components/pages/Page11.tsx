"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { toyMctsQuality, type ToyGame } from "@/lib/search";
import { useStore } from "@/store/useStore";

const PAGE_N = 11;
const GAME: ToyGame = { armValues: [0.2, 0.5, 0.9, 0.45, 0.3] };
const BUDGETS = [1, 2, 4, 8, 16, 32, 64, 128];
const RUNS = 200;

export function Page11() {
  const page = getPage(PAGE_N)!;
  const [budget, setBudget] = useState(1);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const quality = toyMctsQuality(GAME, budget, RUNS, 7) * 100;
  const bestPossible = Math.max(...GAME.armValues) * 100;
  const curve = BUDGETS.map((n) => ({ x: n, y: toyMctsQuality(GAME, n, RUNS, 7) * 100 }));

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
        Tree search in language models has a famous ancestor. AlphaGo read many moves ahead with{" "}
        <strong>Monte Carlo Tree Search</strong> — simulating rollouts, then playing the move it had
        explored most. Give it a bigger look-ahead budget and its move quality climbs toward the best
        possible move.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Look-ahead budget (rollouts)"
            min={1}
            max={128}
            value={budget}
            suffix=" rollouts"
            onChange={(v) => {
              setBudget(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber value={quality} suffix="%" tone="correct" label={`move quality (best possible ≈ ${bestPossible.toFixed(0)}%)`} />
          <p className="text-xs italic text-ink-muted">
            Illustrative toy MCTS (PUCT selection), not a published curve — it shows the mechanism,
            the same idea behind AlphaGo/AlphaZero.
          </p>
        </div>
        <LineChart
          title="Move quality versus look-ahead budget"
          points={curve}
          xLabel="rollouts"
          yLabel="move quality (%)"
          yDomain={[0, 100]}
          xDomain={[1, 128]}
          markerX={budget}
          referenceY={bestPossible}
          referenceLabel="best possible move"
        />
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
