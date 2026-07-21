"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;

function TreeViz({ b }: { b: number }) {
  const width = 460;
  const height = 220;
  const rootX = width / 2;
  const childY = 90;
  const leafY = 180;
  const childXs = Array.from({ length: b }, (_, i) => ((i + 1) * width) / (b + 1));
  // The "best" branch (kept); others are pruned/dimmed.
  const bestChild = Math.floor(b / 2);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={`Search tree with branching factor ${b}; one promising branch is expanded, the rest pruned.`}>
      {childXs.map((cx, i) => {
        const kept = i === bestChild;
        return (
          <g key={i} opacity={kept ? 1 : 0.35}>
            <line x1={rootX} y1={30} x2={cx} y2={childY} className="stroke-grid" strokeWidth={1.5} />
            <circle cx={cx} cy={childY} r={9} className={kept ? "fill-compute" : "fill-surface-raised"} stroke="currentColor" />
            {kept &&
              childXs.map((lx2, j) => {
                const leafX = ((j + 1) * width) / (b + 1);
                const solved = j === bestChild;
                return (
                  <g key={j}>
                    <line x1={cx} y1={childY} x2={leafX} y2={leafY} className="stroke-grid" strokeWidth={1} />
                    <circle cx={leafX} cy={leafY} r={7} className={solved ? "fill-correct" : "fill-surface-raised"} />
                  </g>
                );
              })}
          </g>
        );
      })}
      <circle cx={rootX} cy={30} r={10} className="fill-ink" />
    </svg>
  );
}

export function Page9() {
  const page = getPage(PAGE_N)!;
  const data = curves.treeOfThoughts;
  const { io, cot, cotSc } = data.fit!.params;
  const [b, setB] = useState(1);
  const recordInteraction = useStore((s) => s.recordInteraction);
  const accuracy = interpolate(data, b);

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
        Instead of committing to one chain, treat reasoning as a <strong>maze</strong>: branch into
        several partial thoughts, evaluate them, prune the dead ends, and back up. Widen the search
        (branching factor <em>b</em>) and watch Game-of-24 success climb.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Branching factor (b)"
            min={1}
            max={5}
            value={b}
            onChange={(v) => {
              setB(v);
              recordInteraction(PAGE_N);
            }}
          />
          <BigNumber value={accuracy} suffix="%" tone="correct" label={`Game of 24 solved (b = ${b})`} />
          <div className="rounded border border-grid bg-surface p-3 text-sm text-ink-muted">
            For reference, on the same task: input-output prompting {io}%, chain-of-thought {cot}%,
            CoT with self-consistency {cotSc}%. Tree-of-Thoughts reaches{" "}
            <strong className="text-correct">74%</strong> at b = 5.
          </div>
        </div>
        <TreeViz b={b} />
      </div>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
