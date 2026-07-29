"use client";

/**
 * Page 15, "The Scoreboard: Benchmarks That Track Reasoning" — where Act 3
 * turns from the frontier pair (13–14) to the caveats. Every claim this act
 * has made or weighs ("o1 reasons", "R1 matches it", "the collapse is
 * an artifact") arrives as a benchmark score, so before weighing any of them
 * the reader needs to know how the scoreboard works — and how it fails.
 *
 * Three moves, one per section:
 *   1. The dashboard. Pick a benchmark, read its arc: dots are published
 *      scores (each one selectable, with its source and its asterisk), the
 *      thin staircase is the best-so-far frontier, the dashed lines are the
 *      bars humans set (PhD experts at 69.7 on GPQA, the IMO gold medalist
 *      at 90 on MATH, saturation at 95 on GSM8K). The reasoning-model cliff
 *      of late 2024 is visible on every one of them.
 *   2. The treadmill. Same data, one derived figure: each benchmark's shelf
 *      life from introduction to the day its bar fell. MATH stood almost four
 *      years; GPQA eleven months; AIME 2024 fell inside its own calendar
 *      year. Harder tests are dying faster, which is why the goalposts
 *      moving is the system working, not a scandal.
 *   3. The asterisks. Three ways a headline number is softer than it looks,
 *      each anchored to a dot the reader can go back and click: compute
 *      settings (o1's 74/83/93 on AIME is ONE model under three inference
 *      budgets), the ruler changing under the name (MATH → MATH-500, OpenAI's
 *      12% vs DeepSeek's 9.3% for the same GPT-4o), and the FrontierMath
 *      dispute (25.2% internal/high-compute/180 problems vs Epoch AI's ~10%
 *      on the released model and the 290-problem set, with the funding
 *      disclosed late).
 *
 * ARC-AGI is deliberately absent from the picker: its story is the price
 *  tag, and page 17 tells it with a dollar axis.
 *
 * Data: data/benchmark-scoreboard.json through lib/scoreboard.ts, the same
 * citation+provenance discipline as the curve registry; every dot's number,
 * source and caveat are pinned in scoreboard.test.ts. No simulation here —
 * the page is a reading lesson, and the only honest interaction with field
 * data is selecting which of it to read.
 *
 * Replaces the "Wait button" stub that used to hold this slot: budget
 * forcing is taught in full on page 6 (the s1 "Wait" dial), so the slot was
 * a duplicate.
 */

import { useMemo, useState } from "react";
import { scaleLinear } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { frontierOf, SCOREBOARD, type Benchmark, type ScoreEntry } from "@/lib/scoreboard";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;
const W = 560;
const H = 300;

/** Page 15's references, numbered in order of first appearance. */
const REF = { math: 1, gpqa: 2, openai: 3, deepseek: 4, swebench: 5, frontiermath: 6, epoch: 7 } as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 2024.7 → "Sep 2024" (fraction of a year ≈ month/12). */
function fmtWhen(x: number): string {
  const year = Math.floor(x);
  const m = Math.min(11, Math.floor((x - year) * 12));
  return `${MONTHS[m]} ${year}`;
}

/** "2.4 years" / "11 months" between two decimal years. */
function fmtSpan(years: number): string {
  return years < 1 ? `${Math.round(years * 12)} months` : `${years.toFixed(1)} years`;
}

const fmtScore = (e: ScoreEntry, b: Benchmark) =>
  `${e.y.toLocaleString("en-US")}${b.unitShort}`;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** One benchmark's timeline: score dots, the frontier staircase, the bars. */
function ScoreChart({
  bench,
  xDomain,
  selected,
  onSelect,
}: {
  bench: Benchmark;
  xDomain: [number, number];
  selected: ScoreEntry;
  onSelect: (e: ScoreEntry) => void;
}) {
  const innerW = W - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = H - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const x = scaleLinear().domain(xDomain).range([0, innerW]);
  const y = scaleLinear().domain(bench.yDomain).range([innerH, 0]);
  const frontier = frontierOf(bench.entries);
  const yTicks = y.ticks(5);
  const xTicks = [2021, 2022, 2023, 2024, 2025];

  return (
    <ChartFrame
      title={`${bench.name}: published scores over time, in ${bench.unit}. ${bench.status}.`}
      width={W}
      height={H}
      xLabel="when the score was reported"
      yLabel={bench.unit}
      role="group"
    >
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t.toLocaleString("en-US")}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t}
        </text>
      ))}

      {bench.refLines.map((r) => (
        <g key={r.label}>
          <line
            x1={0}
            x2={innerW}
            y1={y(r.y)}
            y2={y(r.y)}
            className="stroke-ink-muted"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text x={innerW - 4} y={y(r.y) - 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {r.label}
          </text>
        </g>
      ))}

      {/* the best-so-far staircase the headlines trace */}
      <path
        d={frontier.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.x)},${y(p.y)}`).join("")}
        fill="none"
        className="stroke-compute"
        strokeWidth={1.5}
        strokeDasharray="2 3"
      />

      {/* every published score, selectable */}
      {bench.entries.map((e) => {
        const isSel = e === selected;
        return (
          <g
            key={`${e.x}-${e.model}`}
            role="button"
            tabIndex={0}
            aria-pressed={isSel}
            aria-label={`${e.model}, ${fmtWhen(e.x)}: ${fmtScore(e, bench)}. Select to read the source and the caveat.`}
            className="cursor-pointer focus:outline-none"
            onClick={() => onSelect(e)}
            onFocus={() => onSelect(e)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter" || ev.key === " ") {
                ev.preventDefault();
                onSelect(e);
              }
            }}
          >
            {/* invisible halo: a hit target bigger than the painted dot */}
            <circle cx={x(e.x)} cy={y(e.y)} r={12} fill="transparent" />
            <circle
              cx={x(e.x)}
              cy={y(e.y)}
              r={isSel ? 6.5 : 4.5}
              strokeWidth={2}
              className={isSel ? "fill-compute stroke-ink" : "fill-compute stroke-canvas"}
            />
          </g>
        );
      })}
    </ChartFrame>
  );
}

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const { xDomain, benchmarks } = SCOREBOARD;

  const [benchKey, setBenchKey] = useState(benchmarks[0].key);
  const bench = benchmarks.find((b) => b.key === benchKey)!;
  /* Default to the latest dot, so the readout is never empty. */
  const [picked, setPicked] = useState<Record<string, ScoreEntry>>({});
  const selected = picked[benchKey] ?? bench.entries[bench.entries.length - 1];

  const lifespans = useMemo(
    () => benchmarks.filter((b) => b.lifespan !== null && b.key !== "swebench"),
    [benchmarks],
  );
  const trackPct = (yr: number) => ((yr - xDomain[0]) / (xDomain[1] - xDomain[0])) * 100;

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
        Every claim in this act — <em>&ldquo;it reasons&rdquo;</em>,{" "}
        <em>&ldquo;it matches PhDs&rdquo;</em>, <em>&ldquo;it collapsed&rdquo;</em> — arrives as a
        score on a benchmark. A score is evidence about <strong className="text-ink">one test</strong>,
        read under <strong className="text-ink">one set of settings</strong>, and every test has a{" "}
        <strong className="text-ink">shelf life</strong>: models saturate it, and a harder one takes
        its place. This page is the reading lesson for the rest of the act.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the dashboard */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Pick a test, read its arc
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              published scores · no simulation
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Benchmark">
              {benchmarks.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  aria-pressed={benchKey === b.key}
                  onClick={() => {
                    setBenchKey(b.key);
                    recordInteraction(PAGE_N);
                  }}
                  className={`rounded px-3 py-1.5 text-sm ${
                    benchKey === b.key
                      ? "bg-compute text-canvas"
                      : "border border-grid bg-surface-raised text-ink-muted"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            <p className="text-sm text-ink">
              <strong>{bench.name}</strong> asks: {bench.ask}.{" "}
              <span className="text-ink-muted">Where it stands: {bench.status}.</span>
            </p>

            <ScoreChart
              bench={bench}
              xDomain={xDomain}
              selected={selected}
              onSelect={(e) => {
                setPicked((p) => ({ ...p, [benchKey]: e }));
                recordInteraction(PAGE_N);
              }}
            />

            {/* the selected dot's receipt */}
            <div className="flex flex-col gap-1 rounded-lg border-l-4 border-compute bg-surface-raised p-3">
              <p className="text-sm text-ink">
                <strong>{selected.model}</strong>
                <span className="text-ink-muted"> · {fmtWhen(selected.x)} · </span>
                <span className="font-mono font-bold tabular-nums text-compute">
                  {fmtScore(selected, bench)}
                </span>
              </p>
              <p className="text-xs text-ink-muted">reported in: {selected.source}</p>
              {selected.note ? <p className="text-sm text-ink">✱ {selected.note}</p> : null}
            </div>

            <p className="text-xs text-ink-muted">
              dots are headline numbers transcribed from the cited reports; the dashed staircase is
              the best score to date · one family is missing on purpose: ARC-AGI&apos;s story is the
              price tag, and page 17 tells it with a dollar axis
            </p>
          </div>
        </section>

        <Note kicker="How to read">
          <p>Every dot is a published score. Click one for its source — and its asterisk.</p>
          <p>Dashed horizontal lines are bars humans set: experts, a gold medalist, saturation.</p>
          <p>
            Watch late 2024 on every tab: that cliff is the reasoning models arriving.
          </p>
        </Note>

        {/* Step 2 — the treadmill */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The treadmill
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              same data, read as shelf lives
            </span>
          </h2>
          <figure className="m-0 flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <div className="flex flex-col gap-2.5">
              {lifespans.map((b) => {
                const ls = b.lifespan!;
                const end = ls.fell ?? xDomain[1];
                const left = trackPct(ls.introduced);
                const width = Math.max(1.5, trackPct(end) - left);
                return (
                  <div key={b.key} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-36 shrink-0 text-ink-muted">{b.name}</span>
                      <div
                        role="img"
                        aria-label={`${b.name}: introduced ${fmtWhen(ls.introduced)}, ${
                          ls.fell === null
                            ? "still standing"
                            : `bar fell ${fmtWhen(ls.fell)} — stood ${fmtSpan(ls.fell - ls.introduced)}`
                        } (${ls.bar}).`}
                        className="relative h-3 flex-1 rounded-sm border border-grid bg-canvas"
                      >
                        <div
                          className={`absolute inset-y-0 rounded-sm ${
                            ls.fell === null ? "border border-dashed border-compute bg-compute/15" : "bg-compute/60"
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums text-ink">
                        {ls.fell === null ? "standing" : fmtSpan(ls.fell - ls.introduced)}
                      </span>
                    </div>
                    <p className="text-right text-xs text-ink-muted">{ls.bar}</p>
                  </div>
                );
              })}
            </div>
            <figcaption className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
              Bar = from a benchmark&apos;s introduction to the day its own bar fell (the dashed
              lines in step 1). MATH stood almost four years;
              <Cite n={REF.math} /> GPQA eleven months;
              <Cite n={REF.gpqa} /> AIME 2024 fell inside its own calendar year. Each replacement is deliberately harder, and dies
              faster anyway — <strong className="text-ink">the moving goalposts are the system
              working</strong>: a saturated test measures nothing, so retiring it is the honest
              move.
            </figcaption>
          </figure>
        </section>
        <div aria-hidden="true" />

        {/* Step 3 — the fine print */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Read the asterisks</h2>
          <p className="text-ink-muted">
            Three ways a headline number is softer than it looks. All three are sitting in the dots
            you just clicked.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
              <strong>The knob behind the number.</strong> On AIME, o1 scores 74, 83 or 93 —{" "}
              <em>one model</em>, under one sample, 64-vote consensus, or 1,000 re-ranked samples.
              <Cite n={REF.openai} />
              Those are Act 2&apos;s levers running at someone else&apos;s expense; a headline that
              omits the setting is quoting the dial, not the machine.
            </div>
            <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
              <strong>The ruler changes under the name.</strong> &ldquo;MATH&rdquo; quietly became
              MATH-500, a 500-problem slice. The same GPT-4o scores 12% on AIME in OpenAI&apos;s
              harness and 9.3% in DeepSeek&apos;s.
              <Cite n={REF.openai} />
              <Cite n={REF.deepseek} /> On SWE-bench, the agent scaffold around the model moves
              scores by double digits.
              <Cite n={REF.swebench} /> Compare numbers only inside one report.
            </div>
            <div className="rounded-lg border-l-4 border-wrong bg-surface p-4 text-sm text-ink">
              <strong>The dispute, live.</strong> o3&apos;s famous 25.2% on FrontierMath was
              measured by OpenAI internally, at aggressive compute, on the 180-problem version —
              and OpenAI had funded the benchmark, disclosed late.
              <Cite n={REF.frontiermath} /> Epoch AI&apos;s independent run of the{" "}
              <em>released</em> o3 on the newer 290-problem set: about 10%.
              <Cite n={REF.epoch} /> Both dots are on the FrontierMath tab; neither is a lie; the
              gap is the fine print.
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            So the scoreboard is real — the late-2024 cliff shows up on every test, under
            everybody&apos;s harness — but a score is a reading, not a property.{" "}
            <em className="text-ink-muted">
              Next: how models are trained to climb these boards at all. Turn the page.
            </em>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.math}>
            Hendrycks et al. 2021, <em>MATH</em>.
          </RefItem>
          <RefItem n={REF.gpqa}>
            Rein et al. 2023, <em>GPQA</em>.
          </RefItem>
          <RefItem n={REF.openai}>
            OpenAI 2024, the o1 and o3 announcements.
          </RefItem>
          <RefItem n={REF.deepseek}>
            DeepSeek-AI 2025.
          </RefItem>
          <RefItem n={REF.swebench}>
            Jimenez et al. 2024, <em>SWE-bench</em>.
          </RefItem>
          <RefItem n={REF.frontiermath}>
            Glazer et al. 2024, <em>FrontierMath</em>.
          </RefItem>
          <RefItem n={REF.epoch}>
            Epoch AI and TechCrunch 2025, on the FrontierMath dispute.
          </RefItem>
          <p>
            The remaining dot-level sources (Cobbe et al. 2021; OpenAI 2023; Anthropic 2024; Wei et
            al. 2022) travel with their dots — select one in step 1 for its receipt.
          </p>
        </Note>
      </div>

      <div className="flex flex-wrap gap-2">
        {benchmarks.map((b) => (
          <CitationBadge key={b.key} citation={b.citation} />
        ))}
      </div>
      <p className="text-xs text-ink-muted">
        every dot is transcribed verbatim from the cited report — announcement figures (o3,
        FrontierMath) are vendor-reported and not peer-reviewed, and each one&apos;s caveat travels
        with it in the data file · pinned in the test suite
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
