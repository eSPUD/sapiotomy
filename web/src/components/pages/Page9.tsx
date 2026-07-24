"use client";

import { useState } from "react";
import { BigNumber } from "@/components/BigNumber";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { bestOfN, sampleGrid, type BestOfNModel } from "@/lib/sim";
import type { Citation } from "@/lib/data";
import { useStore } from "@/store/useStore";

const PAGE_N = 9;
const MODEL: BestOfNModel = { p: 0.35, distractors: 4, verifierReliability: 0.85 };
const SEED = 26082024;
const TRIALS = 3000;

const COBBE: Citation = {
  ref: "Cobbe et al. 2021",
  url: "https://arxiv.org/abs/2110.14168",
  venue: "arXiv",
  preprint: true,
};

type Method = "random" | "majority" | "verifier";

export function Page9() {
  const page = getPage(PAGE_N)!;
  const [n, setN] = useState(8);
  const [method, setMethod] = useState<Method>("verifier");
  const recordInteraction = useStore((s) => s.recordInteraction);

  const result = bestOfN(n, TRIALS, SEED, MODEL);
  const accuracy = result[method];
  const candidates = sampleGrid(MODEL.p, n, SEED + n); // representative draw for the cards

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
        If the right answer is often in the pile but voting can&apos;t surface it, add a{" "}
        <strong>verifier</strong>: generate N candidates and let a reward model grade them, keeping
        its top pick — like a teacher marking every draft and choosing the best.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Candidates (N)"
            min={1}
            max={16}
            value={n}
            suffix=" drafts"
            onChange={(v) => {
              setN(v);
              recordInteraction(PAGE_N);
            }}
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm text-ink-muted">Selection method</legend>
            <div className="flex gap-2">
              {(["random", "majority", "verifier"] as Method[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={method === m}
                  onClick={() => {
                    setMethod(m);
                    recordInteraction(PAGE_N);
                  }}
                  className={`rounded px-3 py-1.5 text-sm capitalize ${
                    method === m ? "bg-compute text-canvas" : "bg-surface-raised text-ink-muted"
                  }`}
                >
                  {m === "random" ? "Pick randomly" : m === "majority" ? "Majority vote" : "Verifier picks"}
                </button>
              ))}
            </div>
          </fieldset>
          <BigNumber value={accuracy} suffix="%" tone="correct" label={`accuracy — ${method} selection`} />
          <p className="text-sm text-ink-muted">
            The verifier beats both random picking (≈ the per-draft rate) and majority voting,
            because it can recognise a correct draft even when it&apos;s a minority.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-ink-muted">A representative batch of {n} draft{n === 1 ? "" : "s"}:</p>
          <div className="flex flex-wrap gap-2" role="img" aria-label={`${candidates.filter(Boolean).length} of ${n} drafts are correct`}>
            {candidates.map((ok, i) => (
              <span
                key={i}
                title={ok ? "correct draft" : "wrong draft"}
                className={`flex h-10 w-10 items-center justify-center rounded border text-sm ${
                  ok ? "border-correct bg-correct/20 text-correct" : "border-grid bg-surface text-ink-muted"
                }`}
              >
                {ok ? "✓" : "✗"}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <CitationBadge citation={COBBE} />
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
