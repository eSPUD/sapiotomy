"use client";

/**
 * Page 11, "The Keystone" — the act's tools (voting, verifiers, search) all
 * spend inference FLOPs to buy accuracy. This page states the law that makes
 * that spending strategic: parameters and test-time thinking draw on the SAME
 * currency, and on all but the hardest prompts, thinking is the better buy.
 *
 * Step 1 is the signature two-knob allocator (lib/allocator.ts): model size vs
 * test-time samples, against the fixed target of a 14x larger model answering
 * once. The curves are AUTHORED shapes pinned to Snell et al. 2024's verbatim
 * claims (the 14x FLOPs-matched win where the base model has non-trivial
 * success; saturation below the target on the hardest prompts) — every
 * behaviour the reader can trigger is pinned in act2allocator.test.ts.
 *
 * Step 2 states the law and its fine print (the >4x compute-optimal claim, the
 * two mechanisms, the ratio R that flips the verdict back to pretraining).
 *
 * Step 3 is field data: Table 1 of Wu et al. 2024 (data/rebase-pareto.json),
 * digitized verbatim — Llemma-7B with REBASE tree search edging Llemma-34B's
 * best sampling run with ~8x fewer FLOPs, plus the saturation caveat.
 */

import { useMemo, useState } from "react";
import { scaleLinear, scaleLog } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import {
  accuracy,
  BIG_MODEL,
  ceiling,
  DIFFICULTIES,
  flopsOf,
  MAX_EXP,
  MODEL_SIZES,
  target,
  type Difficulty,
} from "@/lib/allocator";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 11;

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: "the small model already answers most of these right on the first try",
  medium: "the small model succeeds sometimes — a non-trivial success rate",
  hard: "the small model almost never succeeds on its own",
};

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** A small legend swatch + label. */
function Key({ shape, className, label }: { shape: "circle" | "diamond"; className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block h-3 w-3 ${shape === "diamond" ? "rotate-45" : "rounded-full"} ${className}`}
      />
      {label}
    </span>
  );
}

/** Wu et al. 2024, Table 1 as a scatter: accuracy vs inference FLOPs, log x. */
function ParetoScatter() {
  const data = curves.rebasePareto;
  const p = data.fit!.params;
  const rows = [
    { model: "Mistral-7B", rebase: false, flops: p.mistral7bSamplingFlops, acc: p.mistral7bSamplingAcc, dx: -8, dy: 4, anchor: "end" as const },
    { model: "Mistral-7B", rebase: true, flops: p.mistral7bRebaseFlops, acc: p.mistral7bRebaseAcc, dx: 8, dy: 4, anchor: "start" as const },
    { model: "Llemma-7B", rebase: false, flops: p.llemma7bSamplingFlops, acc: p.llemma7bSamplingAcc, dx: -8, dy: 4, anchor: "end" as const },
    { model: "Llemma-7B", rebase: true, flops: p.llemma7bRebaseFlops, acc: p.llemma7bRebaseAcc, dx: 8, dy: -8, anchor: "start" as const },
    { model: "Llemma-34B", rebase: false, flops: p.llemma34bSamplingFlops, acc: p.llemma34bSamplingAcc, dx: 8, dy: 4, anchor: "start" as const },
    { model: "Llemma-34B", rebase: true, flops: p.llemma34bRebaseFlops, acc: p.llemma34bRebaseAcc, dx: 8, dy: 4, anchor: "start" as const },
  ];

  const width = 560;
  const height = 280;
  const innerW = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLog().domain([1, 20]).range([0, innerW]);
  const y = scaleLinear().domain([40, 52]).range([innerH, 0]);

  // The headline pair: 7B + tree search vs 34B + sampling, same accuracy.
  const a = rows[3];
  const b = rows[4];
  const savings = Math.round(b.flops / a.flops);

  const title = `Accuracy on MATH500 against inference FLOPs, log x axis. ${rows
    .map(
      (r) =>
        `${r.model} with ${r.rebase ? "REBASE tree search" : "sampling"}: ${r.acc} percent at ${r.flops} times ten to the fourteen FLOPs`,
    )
    .join("; ")}. Llemma-7B with tree search matches Llemma-34B's sampling accuracy with about ${savings} times fewer FLOPs.`;

  return (
    <ChartFrame
      title={title}
      width={width}
      height={height}
      xLabel="inference FLOPs (×10¹⁴, log scale)"
      yLabel="MATH500 accuracy (%)"
    >
      {[40, 44, 48, 52].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {[1, 2, 5, 10, 20].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      {/* the headline pair, tied together: same accuracy, ~8x fewer FLOPs */}
      <line
        x1={x(a.flops)}
        y1={y(a.acc)}
        x2={x(b.flops)}
        y2={y(b.acc)}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text
        x={(x(a.flops) + x(b.flops)) / 2}
        y={Math.min(y(a.acc), y(b.acc)) - 8}
        textAnchor="middle"
        className="fill-ink text-[10px] font-semibold"
      >
        same accuracy · {savings}× fewer FLOPs
      </text>

      {rows.map((r) => (
        <g key={`${r.model}-${r.rebase}`}>
          {r.rebase ? (
            <rect
              x={x(r.flops) - 4}
              y={y(r.acc) - 4}
              width={8}
              height={8}
              transform={`rotate(45 ${x(r.flops)} ${y(r.acc)})`}
              className="fill-correct stroke-canvas"
              strokeWidth={1.5}
            />
          ) : (
            <circle cx={x(r.flops)} cy={y(r.acc)} r={4.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
          )}
          <text
            x={x(r.flops) + r.dx}
            y={y(r.acc) + r.dy}
            textAnchor={r.anchor}
            className="fill-ink-muted text-[9px]"
          >
            {r.model}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

export function Page11() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [exp, setExp] = useState(0);

  const size = MODEL_SIZES[sizeIdx];
  const k = 2 ** exp;
  const acc = accuracy(difficulty, size, k);
  const cost = flopsOf(size, k);
  const tgt = target(difficulty);
  const cap = ceiling(difficulty, size);

  // The full trajectory of the chosen model as the test-time knob turns.
  const curve = useMemo(
    () =>
      Array.from({ length: MAX_EXP + 1 }, (_, e) => ({
        x: flopsOf(size, 2 ** e),
        y: accuracy(difficulty, size, 2 ** e),
      })),
    [size, difficulty],
  );

  const beaten = acc >= tgt;
  const verdict = beaten
    ? cost < BIG_MODEL
      ? {
          tone: "border-correct bg-correct/15",
          head: `✓ matched the 14× model's ${tgt.toFixed(0)}% — for ${(BIG_MODEL / cost).toFixed(1)}× less compute`,
          headTone: "text-correct",
          body: "Test-time compute just did the work of parameters. That is the FLOPs-matched headline result.",
        }
      : {
          tone: "border-compute bg-compute/10",
          head: `matched it — but you spent ${cost} units, and the 14× model needs only ${BIG_MODEL}`,
          headTone: "text-ink",
          body: "The win only counts while your bill stays under the big model's. Back off the knobs and find the cheap crossing.",
        }
    : cap < tgt
      ? {
          tone: "border-wrong bg-wrong/15",
          head: `✗ this model saturates near ${cap.toFixed(0)}% — the target is out of reach`,
          headTone: "text-wrong",
          body: "No sample budget closes the gap: the curve flattens below the dashed line. On problems this far past the base model, pretraining the larger model is the better buy.",
        }
      : {
          tone: "border-grid bg-surface-raised",
          head: `${acc.toFixed(1)}% so far — the 14× model gets ${tgt.toFixed(0)}%`,
          headTone: "text-ink",
          body: "Keep turning the test-time knob and watch what it costs.",
        };

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        Every tool in this act buys accuracy with inference compute. Here is the law that makes the
        spending strategic: a bigger model and a longer think are{" "}
        <strong className="text-ink">two ways to spend the same FLOPs</strong>. Pretraining burns
        them once, up front, into parameters; test-time compute burns them at question time, on the
        question that needs them. Matched budget for budget —{" "}
        <strong className="text-ink">which buys more accuracy?</strong>
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the two-knob allocator */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Beat the 14× model
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored illustrative curves · no live model
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-ink">
              Inference FLOPs grow with parameter count, so the unit here is{" "}
              <strong>one answer from the small model</strong>. An answer from a model 14× its size
              costs ≈14 units — and that model, answering once, scores{" "}
              <strong className="text-ink">{tgt.toFixed(0)}%</strong> on this difficulty. Your job:
              match that score for fewer units, using a smaller model that thinks.
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink-muted">Problem difficulty</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Problem difficulty">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={difficulty === d}
                    onClick={() => {
                      setDifficulty(d);
                      recordInteraction(PAGE_N);
                    }}
                    className={`rounded border px-3 py-1.5 text-sm capitalize ${
                      difficulty === d
                        ? "border-compute bg-compute/15 font-semibold text-ink"
                        : "border-grid bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="text-xs text-ink-muted">{DIFFICULTY_BLURB[difficulty]}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Slider
                label="Model size (pretraining scale)"
                min={0}
                max={MODEL_SIZES.length - 1}
                value={sizeIdx}
                format={(v) => `${MODEL_SIZES[v]}×`}
                onChange={(v) => {
                  setSizeIdx(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <Slider
                label="Test-time compute"
                min={0}
                max={MAX_EXP}
                value={exp}
                format={(v) => String(2 ** v)}
                suffix=" samples"
                onChange={(v) => {
                  setExp(v);
                  recordInteraction(PAGE_N);
                }}
              />
            </div>

            <LineChart
              title={`Accuracy against total inference FLOPs on ${difficulty} problems, log x axis. The ${size}x model's curve rises from ${curve[0].y.toFixed(1)} percent toward its ceiling of ${cap.toFixed(0)} percent as samples increase; the dashed target line marks ${tgt.toFixed(0)} percent, the 14x model's one-answer score, at 14 FLOPs units.`}
              points={curve}
              markerX={cost}
              referenceY={tgt}
              referenceLabel="the target"
              dots={[{ x: BIG_MODEL, y: tgt, label: "14× model · 1 answer" }]}
              logX
              xDomain={[1, 4096]}
              xTicks={[1, 10, 100, 1000]}
              yDomain={[0, 100]}
              xLabel="total inference FLOPs (units of one small-model answer, log scale)"
              yLabel="accuracy (%)"
              width={560}
              height={260}
            />

            <div className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: "your accuracy",
                  value: `${acc.toFixed(1)}%`,
                  tone: beaten ? "text-correct" : "text-ink",
                  note: `${size}× model · ${k} sample${k === 1 ? "" : "s"}`,
                },
                {
                  label: "your bill",
                  value: String(cost),
                  tone: "text-compute",
                  note: "FLOPs units spent",
                },
                {
                  label: "the target",
                  value: `${tgt.toFixed(0)}%`,
                  tone: "text-ink",
                  note: "14× model · 14 units",
                },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-grid bg-surface-raised p-3">
                  <p className={`font-mono text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</p>
                  <p className="text-xs text-ink">{s.label}</p>
                  <p className="text-xs text-ink-muted">{s.note}</p>
                </div>
              ))}
            </div>

            <div className={`rounded border-l-4 p-3 text-sm ${verdict.tone}`} role="status">
              <p className={`font-semibold ${verdict.headTone}`}>{verdict.head}</p>
              <p className="mt-1 text-ink">{verdict.body}</p>
            </div>
          </div>
        </section>
        <Note kicker="Try it">
          <p>
            On medium, turn only the test-time knob until the curve crosses the dashed line, and
            check the bill.
          </p>
          <p>Then switch to hard and try to cross at all.</p>
        </Note>

        {/* Step 2 — the law, stated */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. The law, and its fine print</h2>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              Snell et al. measured two ways of turning test-time FLOPs into accuracy:{" "}
              <strong>searching</strong> the sample stream against a dense process verifier (page
              9&rsquo;s step-graders put to work) and letting the model <strong>revise</strong> its
              own answer, updating its response distribution as it goes. Neither dominates. The
              keystone is the allocation rule: estimate how hard the prompt is,{" "}
              <em>then</em> choose the strategy and budget for that difficulty.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="font-mono text-2xl font-bold text-correct">&gt;4×</p>
                <p className="text-xs text-ink">more efficient than best-of-N</p>
                <p className="text-xs text-ink-muted">
                  the same FLOPs, allocated per-prompt by difficulty instead of spent uniformly
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="font-mono text-2xl font-bold text-correct">14×</p>
                <p className="text-xs text-ink">larger model outperformed, FLOPs-matched</p>
                <p className="text-xs text-ink-muted">
                  on prompts where the small model has a non-trivial success rate
                </p>
              </div>
              <div className="rounded-lg border border-grid bg-surface-raised p-3">
                <p className="font-mono text-2xl font-bold text-wrong">high R</p>
                <p className="text-xs text-ink">where the verdict flips</p>
                <p className="text-xs text-ink-muted">
                  R = inference tokens ÷ pretraining tokens; when it is large, parameters win
                </p>
              </div>
            </div>
            <p className="text-sm text-ink-muted">
              The fine print is what you just felt on <em>hard</em>: the win exists only where the
              small model already has a foothold. And it is bounded by deployment, too — thinking
              is billed per question, parameters once. If you expect to serve many inference tokens
              per pretraining token (high R), or the prompts sit past the small model&rsquo;s
              reach, pretraining the larger model is the better bet.
            </p>
          </div>
        </section>
        <Note kicker="References">
          <p>
            Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally can be More Effective
            than Scaling Model Parameters</em>.
          </p>
        </Note>

        {/* Step 3 — the field data */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The frontier, measured</h2>
          <figure className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink-muted">
              The same trade measured in the field, on the MATH benchmark. Wu et al. ran three
              model sizes under plain sampling and under their REBASE tree search; up and to the
              left is better.
            </p>
            <ParetoScatter />
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
              <Key shape="circle" className="bg-compute" label="sampling + weighted voting (64–256 samples)" />
              <Key shape="diamond" className="bg-correct" label="REBASE tree search + weighted voting (32 samples)" />
            </div>
            <figcaption className="text-sm text-ink-muted">
              Every model does better with search than with sampling, at a fraction of the FLOPs —
              and the 7B model with tree search{" "}
              <strong className="text-ink">edges the 34B model&rsquo;s best sampling run with
              roughly 8× fewer FLOPs</strong>. Smaller model plus smarter inference is the
              Pareto-optimal corner. The fine print holds here too: accuracy{" "}
              <strong className="text-ink">saturates</strong> — it converges exponentially toward a
              ceiling set by the model&rsquo;s own output probabilities, so without an oracle
              verifier, sampling alone never reaches 100%.
            </figcaption>
          </figure>
        </section>
        <Note kicker="References">
          <p>
            Wu et al. 2024, <em>Inference Scaling Laws: An Empirical Analysis of Compute-Optimal
            Inference</em>.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={curves.computeOptimal.citation} />
        <CitationBadge citation={curves.rebasePareto.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the allocator&rsquo;s curves are authored, illustrative shapes pinned to the cited claims —
        verbatim from Snell et al. 2024: compute-optimal test-time scaling improves efficiency by
        more than 4× over a best-of-N baseline, and FLOPs-matched it can outperform a 14× larger
        model on problems where the base model attains somewhat non-trivial success rates; no
        published per-difficulty curve fixes the exact numbers shown, and every on-screen behaviour
        is pinned in the test suite · the Pareto chart is digitized verbatim from Table 1 of Wu et
        al. 2024 (MATH500, weighted voting for both strategies) · inference FLOPs are counted ∝
        parameters × tokens, which is why one answer from a 14× model costs ≈14 small-model answers
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
