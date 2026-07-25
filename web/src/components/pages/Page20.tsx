"use client";

import { useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { Toggle } from "@/components/Toggle";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { enumerationSolved, hanoiMoves, hanoiTokens } from "@/lib/frontier";
import { useStore } from "@/store/useStore";

const PAGE_N = 20;

export function Page20() {
  const page = getPage(PAGE_N)!;
  const data = curves.illusion;
  const { tokensPerMove, tokenBudget, riverCrossingImpossibleN } = data.fit!.params;
  const [disks, setDisks] = useState(3);
  const [scoreByAlgorithm, setScoreByAlgorithm] = useState(false);
  const recordInteraction = useStore((s) => s.recordInteraction);

  const moves = hanoiMoves(disks);
  const tokens = hanoiTokens(disks, tokensPerMove);
  const fitsBudget = enumerationSolved(disks, tokensPerMove, tokenBudget);
  const solved = scoreByAlgorithm ? true : fitsBudget;

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
        Two expert witnesses. The <strong>prosecution</strong> (&ldquo;The Illusion of
        Thinking&rdquo;) says reasoning <em>collapses</em> past a complexity threshold. The{" "}
        <strong>defense</strong> says the model just ran out of room to write. Add disks to the Tower
        of Hanoi, then choose how to score it, and reach your own verdict.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Disks (N)"
            min={1}
            max={12}
            value={disks}
            onChange={(v) => {
              setDisks(v);
              recordInteraction(PAGE_N);
            }}
          />
          <div className="rounded-lg border border-grid bg-surface p-3 font-mono text-sm text-ink">
            <div>moves required = 2^{disks} − 1 = {moves.toLocaleString()}</div>
            <div>output tokens ≈ {tokens.toLocaleString()} / budget {tokenBudget.toLocaleString()}</div>
          </div>
          <div className="h-4 w-full rounded bg-surface-raised" aria-hidden="true">
            <div
              className={`h-4 rounded ${fitsBudget ? "bg-correct" : "bg-wrong"}`}
              style={{ width: `${Math.min(100, (tokens / tokenBudget) * 100)}%` }}
            />
          </div>
          <Toggle
            label="Scoring rule"
            checked={scoreByAlgorithm}
            offLabel="By full enumeration"
            onLabel="By algorithm"
            onChange={(v) => {
              setScoreByAlgorithm(v);
              recordInteraction(PAGE_N);
            }}
          />
        </div>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-grid bg-surface p-6">
          <p className="text-sm text-ink-muted">Verdict</p>
          <p className={`text-4xl font-bold ${solved ? "text-correct" : "text-wrong"}`}>
            {solved ? "SOLVED" : "COLLAPSE"}
          </p>
          <p className="text-center text-sm text-ink-muted">
            {scoreByAlgorithm
              ? "Scored on whether it states the correct recursive rule: no token wall."
              : fitsBudget
                ? "The full move list still fits the token budget."
                : "The full move list overflows the token budget. Is that a reasoning failure, or a paper-length limit?"}
          </p>
        </div>
      </div>

      <p className="max-w-2xl text-sm text-ink-muted">
        Note: some River-Crossing instances are mathematically <strong>impossible</strong> for N ≥{" "}
        {riverCrossingImpossibleN}, so &ldquo;failure&rdquo; there can&apos;t be a reasoning deficit
        at all.
      </p>

      <div>
        <CitationBadge citation={data.citation} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
