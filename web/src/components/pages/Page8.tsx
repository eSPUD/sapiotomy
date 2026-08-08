"use client";

/**
 * Page 8, "Best-of-N and Verifiers" — measured, not simulated.
 *
 * The old page ran `LILY_PAD_MODEL`: a Monte Carlo with an invented `appeal`
 * vector and a verifier-reliability slider whose units its own footnote
 * admitted nobody could defend. All three beats now come from
 * `web/data/page-08-derived.json`, produced by `page_08_best_of_n.ipynb` from
 * 12,800 generations and 70,960 judgements. Every number below is loaded
 * through `@/lib/page08`, which refuses to load a run that failed the
 * notebook's gates.
 *
 * The three beats, and what each is allowed to say:
 *
 *   1. ONE BATCH, TWO RULES. A real problem where the vote is confidently
 *      wrong and the verifier is right. The vote reads down the rows (the
 *      longest wins), the verifier reads across (the rightmost wins). The old
 *      page had to invent an appeal vector to manufacture this picture; here
 *      eleven of sixteen chains agreed on a wrong answer without being asked.
 *      Beside it, the same claim over a hundred problems.
 *
 *   2. WHAT EACH RULE FIXED AND BROKE. The page's evidence, and the only
 *      claim it gates on: scoring N candidates and keeping the best beats
 *      taking one, by an exact McNemar over the problems where the two
 *      disagree. ch05's own `heuristic_score` is on the same axis and is the
 *      one rule whose mass sits on the wrong side of zero.
 *
 *   3. WHAT A JUDGE IS WORTH. Five judges spanning size, domain and training
 *      objective, across four temperatures. What a judge can solve does not
 *      predict what it can select; what it was trained for does.
 *
 * The caveat is not buried: against page 7's vote on identical candidates the
 * verifier is +4 points at p=0.45, which is not a difference. That comparison
 * is OURS — `self_consistency_vote` is ch04 and the scorers are ch05, and the
 * book never sets them against each other. The page says so rather than
 * implying the literature agrees.
 *
 * Layout follows pages 1 and 6: an intro paragraph full width above one
 * reading column of numbered steps, each beside a margin note that scrolls
 * with it. The download sits on the top line beside the act kicker, and there
 * is no footer. What the footer used to carry that lives nowhere else is now
 * in the margin note beside the sentence it qualifies.
 *
 * Provenance is pills at the figures rather than a plate under the lede, which
 * is where this page departs from pages 5 to 7. The plate opened the page in
 * the notebook's own language (a token cap, four temperatures, an exact
 * McNemar, a run id forty characters long) and asked the reader to carry all of
 * it down three figures. A reader needs to know a figure is measured and on
 * what, at the figure. The rest is in the download on the top line, which is
 * the only place it can be acted on anyway.
 *
 * No figure on this page renders a notebook identifier. `page08.ts` maps every
 * selector to a reader-facing label and throws on one it does not know, because
 * a row reading `best-of-N (qwen1.5b)` is a figure the reader cannot use.
 */

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { PAGE8, pValue, pct, tidyMath } from "@/lib/page08";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const NOTEBOOK_ZIP = "/notebooks/page-08-best-of-n.zip";

/** Reference numbers, in order of first appearance on the page. */
const REF = {
  cobbe: 1,
  stroebl: 2,
} as const;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/**
 * Provenance beside the figure it belongs to. One row of these replaces the
 * plate that used to sit under the lede: short enough to read without stopping,
 * and only on the figures that would otherwise leave the reader asking whether
 * a number was measured or made up.
 */
function Pills({ items }: { items: string[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
      {items.map((t) => (
        <li
          key={t}
          className="rounded-full border border-grid px-2 py-0.5 text-[11px] text-ink-muted"
        >
          {t}
        </li>
      ))}
    </ul>
  );
}

/**
 * A legend as HTML rather than SVG text: it wraps, it inherits the page's type,
 * and a screen reader reads it as prose instead of as scattered <text> nodes.
 * Both panels of figure 1 need one, and the curve panel is unreadable without
 * it: four lines in four colours and nothing saying which is which.
 */
function Legend({ items }: { items: { cls: string; label: string; dashed?: boolean; ring?: boolean }[] }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-[11px] text-ink-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <svg width={16} height={10} aria-hidden="true" className="shrink-0">
            {i.ring ? (
              <circle cx={8} cy={5} r={4} className={`fill-none ${i.cls}`} strokeWidth={2} />
            ) : i.dashed ? (
              <line x1={0} x2={16} y1={5} y2={5} className={i.cls} strokeWidth={1.5} strokeDasharray="3 3" />
            ) : (
              <line x1={0} x2={16} y1={5} y2={5} className={i.cls} strokeWidth={2.5} />
            )}
          </svg>
          {i.label}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------ figure 1 left */

const SPEC_W = 430;
const SPEC_H = 260;
const SPEC_M = { top: 14, right: 16, bottom: 40, left: 92 };

/**
 * One batch, drawn so both rules are readable at once: answer class down the
 * side so the vote is the longest row, verifier score across so selection is
 * the rightmost dot. When the longest row does not contain the rightmost dot,
 * the two rules disagree, and that is the whole page in one picture.
 */
function SpecimenPanel({ onOpen }: { onOpen: (sampleIndex: number) => void }) {
  const s = PAGE8.specimen;

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of s.candidates) {
      if (c.answer_class === null) continue;
      counts.set(c.answer_class, (counts.get(c.answer_class) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [s.candidates]);

  const scores = s.candidates.map((c) => c.score ?? 0);
  const lo = Math.min(...scores);
  const hi = Math.max(...scores);
  const innerW = SPEC_W - SPEC_M.left - SPEC_M.right;
  const innerH = SPEC_H - SPEC_M.top - SPEC_M.bottom;
  const x = (v: number) => ((v - lo) / (hi - lo || 1)) * (innerW - 24) + 12;
  const rowY = (cls: string) => {
    const i = rows.findIndex(([a]) => a === cls);
    return ((i + 0.5) / rows.length) * innerH;
  };

  return (
    <ChartFrame
      width={SPEC_W}
      height={SPEC_H}
      margin={SPEC_M}
      role="group"
      xLabel={`what the verifier scored it →`}
      title={
        `Sixteen chains for one problem. Each dot is a chain, placed in the row of the answer ` +
        `it gave and along the axis by the verifier's score. The vote takes the longest row, ` +
        `${s.vote.answer ?? "no answer"} with ${s.vote.votes} of ${s.n} chains, and is wrong. ` +
        `The verifier takes the rightmost dot, which is correct.`
      }
    >
      {rows.map(([cls, count], i) => {
        const y = ((i + 0.5) / rows.length) * innerH;
        const isVote = i === 0;
        const correct = s.candidates.find((c) => c.answer_class === cls)?.correct ?? false;
        return (
          <g key={cls}>
            {isVote ? (
              <rect
                x={0}
                y={y - innerH / rows.length / 2}
                width={innerW}
                height={innerH / rows.length}
                className="fill-wrong"
                opacity={0.07}
              />
            ) : null}
            <text
              x={-8}
              y={y + 4}
              textAnchor="end"
              className={`text-[11px] ${correct ? "fill-correct" : "fill-ink-muted"}`}
            >
              {(() => {
                const t = tidyMath(cls);
                return t.length > 13 ? `${t.slice(0, 12)}…` : t;
              })()}{" "}
              ({count})
            </text>
          </g>
        );
      })}

      {s.candidates.map((c, i) => {
        if (c.answer_class === null || c.score === null) return null;
        const cy = rowY(c.answer_class) + ((i % 3) - 1) * 4;
        const picked = c.sample_index === s.verifier.sample_index;
        return (
          <g key={c.sample_index}>
            {picked ? (
              <circle cx={x(c.score)} cy={cy} r={8} className="fill-none stroke-compute" strokeWidth={2} />
            ) : null}
            <circle
              cx={x(c.score)}
              cy={cy}
              r={picked ? 5 : 4}
              className={c.correct ? "fill-correct" : "fill-wrong"}
              tabIndex={0}
              role="button"
              aria-label={`chain ${c.sample_index}, answer ${tidyMath(c.answer ?? "none")}, ${
                c.correct ? "correct" : "wrong"
              }. Open it.`}
              onClick={() => onOpen(c.sample_index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen(c.sample_index);
                }
              }}
              style={{ cursor: "pointer" }}
            />
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ----------------------------------------------------------- figure 1 right */

const CURVE_W = 430;
const CURVE_H = 260;
const CURVE_M = { top: 14, right: 16, bottom: 40, left: 44 };

function CurvePanel() {
  const { axis, lines, headlineSelector } = PAGE8.curve;
  const innerW = CURVE_W - CURVE_M.left - CURVE_M.right;
  const innerH = CURVE_H - CURVE_M.top - CURVE_M.bottom;
  const lgMin = Math.log2(axis[0]);
  const lgMax = Math.log2(axis[axis.length - 1]);
  const x = (n: number) => ((Math.log2(n) - lgMin) / (lgMax - lgMin)) * innerW;
  const y = (v: number) => innerH - v * innerH;

  const series = [
    { key: "one chain", cls: "stroke-ink-muted", label: "one chain" },
    { key: "majority", cls: "stroke-compute", label: "majority vote" },
    { key: headlineSelector, cls: "stroke-correct", label: "best-of-N, trained verifier" },
  ];

  const path = (key: string) => {
    const line = lines.find((l) => l.selector === key);
    if (!line) return "";
    return line.points.map((p) => `${x(p.n)},${y(p.accuracy)}`).join(" ");
  };
  const coverage = lines.find((l) => l.selector === "coverage");

  // The one point where voting is worse than not voting. Found rather than
  // hardcoded: if a re-run moves or removes it, the marker moves or goes.
  const majorityPts = lines.find((l) => l.selector === "majority")?.points ?? [];
  const onePts = lines.find((l) => l.selector === "one chain")?.points ?? [];
  const dip =
    majorityPts.find((p, i) => p.n > 1 && p.accuracy < (onePts[i]?.accuracy ?? 0) - 0.02) ?? null;

  return (
    <ChartFrame
      width={CURVE_W}
      height={CURVE_H}
      margin={CURVE_M}
      xLabel="candidates the rule may look at"
      yLabel="problems solved (%)"
      title={
        `Accuracy against the number of candidates. One chain is flat; majority voting and ` +
        `best-of-N by the trained verifier both climb, the verifier highest. A dotted line ` +
        `above shows how often a correct answer is present at all.`
      }
    >
      {[0, 0.25, 0.5, 0.75, 1].map((g) => (
        <g key={g}>
          <line x1={0} x2={innerW} y1={y(g)} y2={y(g)} className="stroke-grid" strokeWidth={1} />
          <text x={-6} y={y(g) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {Math.round(g * 100)}
          </text>
        </g>
      ))}
      {axis.map((n) => (
        <text key={n} x={x(n)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {n}
        </text>
      ))}
      {coverage ? (
        <polyline
          points={path("coverage")}
          fill="none"
          className="stroke-ink-muted"
          strokeWidth={1.25}
          strokeDasharray="3 3"
        />
      ) : null}
      {series.map((s) => (
        <polyline
          key={s.key}
          points={path(s.key)}
          fill="none"
          className={s.cls}
          strokeWidth={s.key === headlineSelector ? 2.5 : 1.75}
        />
      ))}
      {/* The vote's dip at N=2 reads as an error and is not one: with two
          candidates any disagreement is a tie, and page 7's rule is that a tie
          is not a vote. Marked here because an unexplained kink costs the
          reader more trust than the annotation costs in ink. */}
      {dip ? (
        <g>
          <circle
            cx={x(dip.n)}
            cy={y(dip.accuracy)}
            r={4}
            className="fill-none stroke-compute"
            strokeWidth={1.5}
          />
          <text
            x={x(dip.n) + 7}
            y={y(dip.accuracy) + 11}
            className="fill-compute text-[9px]"
          >
            ties
          </text>
        </g>
      ) : null}
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 2 */

const PAIR_W = 672;
const PAIR_ROW = 30;
// The left margin holds a sentence fragment, not an identifier: "best-of-N,
// 1.5B math specialist" is the longest row label and it has to fit unclipped.
const PAIR_M = { top: 26, right: 96, bottom: 34, left: 206 };

/**
 * Fixed to the right of zero, broken to the left, one row per rule, against
 * the same single-chain baseline on the same problems. The one row whose mass
 * sits left of zero is the heuristic scorer from the source we build on.
 */
function PairedFigure() {
  const rows = useMemo(
    () => [...PAGE8.paired.vsOneChain].sort((a, b) => a.net - b.net),
    [],
  );
  const height = PAIR_M.top + PAIR_M.bottom + rows.length * PAIR_ROW;
  const innerW = PAIR_W - PAIR_M.left - PAIR_M.right;
  const innerH = rows.length * PAIR_ROW;
  const lim = Math.max(...rows.map((r) => Math.max(r.fixed, r.broke))) + 2;
  const x = (v: number) => (v / lim) * (innerW / 2) + innerW / 2;

  return (
    <ChartFrame
      width={PAIR_W}
      height={height}
      margin={PAIR_M}
      xLabel="problems, against one chain"
      title={
        `For each selection rule, how many problems it fixed and how many it broke compared ` +
        `with taking a single chain. The trained verifier fixed ${PAGE8.headline.fixed} and ` +
        `broke ${PAGE8.headline.broke}. The hand-written length heuristic from the source we ` +
        `build on is the only rule that broke more than it fixed.`
      }
    >
      <text x={innerW / 2 + 40} y={-10} textAnchor="middle" className="fill-correct text-[11px] font-semibold">
        fixed
      </text>
      <text x={innerW / 2 - 40} y={-10} textAnchor="middle" className="fill-wrong text-[11px] font-semibold">
        broke
      </text>
      {rows.map((r, i) => {
        const cy = i * PAIR_ROW + PAIR_ROW / 2;
        return (
          <g key={r.selector}>
            <text x={-8} y={cy + 4} textAnchor="end" className="fill-ink text-[11px]">
              {r.label}
            </text>
            <rect
              x={innerW / 2}
              y={cy - 8}
              width={x(r.fixed) - innerW / 2}
              height={16}
              className="fill-correct"
            />
            <rect
              x={x(-r.broke)}
              y={cy - 8}
              width={innerW / 2 - x(-r.broke)}
              height={16}
              className="fill-wrong"
            />
            <text
              x={innerW + 8}
              y={cy + 4}
              className={`text-[10px] ${r.resolved ? "fill-ink" : "fill-ink-muted"}`}
            >
              {r.net > 0 ? `+${r.net}` : r.net} · {pValue(r.p)}
            </text>
          </g>
        );
      })}
      <line x1={innerW / 2} x2={innerW / 2} y1={0} y2={innerH} className="stroke-ink" strokeWidth={1} />
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const JUDGE_W = 460;
const JUDGE_H = 300;
const JUDGE_M = { top: 18, right: 20, bottom: 44, left: 52 };

function JudgeFigure() {
  const innerW = JUDGE_W - JUDGE_M.left - JUDGE_M.right;
  const innerH = JUDGE_H - JUDGE_M.top - JUDGE_M.bottom;
  const yLo = 0.4;
  const yHi = 0.85;
  const x = (v: number) => v * innerW;
  const y = (v: number) => innerH - ((v - yLo) / (yHi - yLo)) * innerH;

  return (
    <ChartFrame
      width={JUDGE_W}
      height={JUDGE_H}
      margin={JUDGE_M}
      xLabel="what the judge solves on its own (%)"
      yLabel="picks a correct candidate (%)"
      title={
        `Each judge's own accuracy against how often it picks a correct candidate, averaged ` +
        `over four temperatures. The points do not trend. The one judge whose mean sits above ` +
        `the majority line is the trained verifier, which cannot solve any of these problems ` +
        `itself. The bars overlap, so no pair of judges is resolved at this sample.`
      }
    >
      <rect
        x={0}
        y={y(PAGE8.bar.hi)}
        width={innerW}
        height={Math.max(0, y(PAGE8.bar.lo) - y(PAGE8.bar.hi))}
        className="fill-compute"
        opacity={0.08}
      />
      <line
        x1={0}
        x2={innerW}
        y1={y(PAGE8.bar.mean)}
        y2={y(PAGE8.bar.mean)}
        className="stroke-compute"
        strokeWidth={1.25}
        strokeDasharray="4 3"
      />
      <text x={innerW - 2} y={y(PAGE8.bar.mean) - 5} textAnchor="end" className="fill-compute text-[10px]">
        majority vote, {pct(PAGE8.bar.mean)}
      </text>
      {[0.4, 0.5, 0.6, 0.7, 0.8].map((g) => (
        <text key={g} x={-6} y={y(g) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
          {Math.round(g * 100)}
        </text>
      ))}
      {[0, 0.25, 0.5, 0.75].map((g) => (
        <text key={g} x={x(g)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {Math.round(g * 100)}
        </text>
      ))}
      {PAGE8.judges.map((j) => {
        const cx = x(j.solves ?? 0);
        return (
          <g key={j.name}>
            <line
              x1={cx}
              x2={cx}
              y1={y(j.hi)}
              y2={y(j.lo)}
              className={j.trained ? "stroke-correct" : "stroke-ink-muted"}
              strokeWidth={1.5}
              opacity={0.5}
            />
            <circle
              cx={cx}
              cy={y(j.mean)}
              r={j.trained ? 6 : 4}
              className={j.trained ? "fill-correct" : "fill-ink-muted"}
            />
            <text
              x={cx + 9}
              y={y(j.mean) + 4}
              className={`text-[10px] ${j.trained ? "fill-correct" : "fill-ink-muted"}`}
            >
              {j.label}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ---------------------------------------------------------------------- page */

export function Page8() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [open, setOpen] = useState<number | null>(null);

  const s = PAGE8.specimen;
  const chain = open === null ? null : s.candidates.find((c) => c.sample_index === open) ?? null;
  const trained = PAGE8.judges.find((j) => j.trained);
  // "Qwen/Qwen2.5-3B-Instruct" reads as a file path. What is after the slash is
  // the model; what is before it is the account that hosts the weights.
  const model = PAGE8.run.model.split("/").pop();

  return (
    <article className="flex flex-col gap-6">
      {/* The download shares the top line with the act kicker, page 5's shape:
          the first thing on the page after the title row is the way to
          re-derive all of it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-muted">
          Act {page.act} · {ACTS[page.act].title}
        </p>
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          notebook + {PAGE8.run.chains.toLocaleString()} traces ↓
        </a>
      </div>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      <p className="max-w-2xl text-lg text-ink-muted">
        Counting asks what is most common. Judging asks what is best. They are not the same
        question, and on {PAGE8.run.items} problems{" "}
        <strong className="text-ink">
          scoring {PAGE8.paired.n} candidates and keeping the best takes {pct(PAGE8.oneChain)} to{" "}
          {pct(PAGE8.headline.accuracy)}
        </strong>
        : {PAGE8.headline.fixed} problems fixed against {PAGE8.headline.broke} broken,{" "}
        {pValue(PAGE8.headline.p)}. Then the part nobody promised us: page 7&apos;s vote, reading
        the same candidates, gets there too.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — one batch, two rules */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Judge one batch two ways</h2>
          <section
            aria-label="One problem's candidates, counted and scored"
            className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
            {/* The page's only statement of what was run and when. It sits on
                the first figure because that is where a reader first has to
                decide whether to believe a picture. */}
            <Pills
              items={[
                `measured ${PAGE8.run.date}`,
                model ?? PAGE8.run.model,
                `${PAGE8.run.items} problems, ${PAGE8.paired.n} chains each`,
              ]}
            />
            <p className="text-sm text-ink">{tidyMath(s.question)}</p>
            <p className="text-xs text-ink-muted">
              {s.n} chains. The vote takes the longest row:{" "}
              <strong className="text-wrong">
                {tidyMath(s.vote.answer ?? "no answer")} on {s.vote.votes} of {s.n}
              </strong>
              , and it is wrong. The <strong className="text-ink">verifier</strong>, a second model
              trained to score finished solutions rather than to write them
              <Cite n={REF.cobbe} />, takes the rightmost dot:{" "}
              <strong className="text-correct">{tidyMath(s.verifier.answer ?? "")}</strong>, which
              is right. The answer is {tidyMath(s.ground_truth)}.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2">
                <SpecimenPanel
                  onOpen={(i) => {
                    setOpen(i === open ? null : i);
                    recordInteraction(PAGE_N);
                  }}
                />
                <Legend
                  items={[
                    { cls: "stroke-correct", label: "a correct chain" },
                    { cls: "stroke-wrong", label: "a wrong one" },
                    { cls: "stroke-compute", label: "what the verifier kept", ring: true },
                  ]}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-2">
                <CurvePanel />
                <Legend
                  items={[
                    { cls: "stroke-correct", label: "best-of-N, trained verifier" },
                    { cls: "stroke-compute", label: "majority vote" },
                    { cls: "stroke-ink-muted", label: "one chain" },
                    { cls: "stroke-ink-muted", label: "a correct answer is present", dashed: true },
                  ]}
                />
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              The vote dips below one chain at two candidates, and that is the rule rather than
              noise: <strong className="text-ink">with only two, any disagreement is a tie</strong>,
              and page 7 counts a tie as no answer. Voting needs a crowd before it beats not
              voting.
            </p>
            {chain ? (
              <div className="rounded border border-grid bg-surface-raised p-3">
                <p className="text-xs text-ink-muted">
                  chain {chain.sample_index} · answer{" "}
                  <span className={chain.correct ? "text-correct" : "text-wrong"}>
                    {tidyMath(chain.answer ?? "none")}
                  </span>{" "}
                  · {chain.chars.toLocaleString()} characters · the verifier scored it{" "}
                  {chain.score?.toFixed(2)}
                </p>
                <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-ink">
                  {tidyMath(chain.trace)}
                </p>
              </div>
            ) : (
              <p className="text-xs text-ink-muted">Click a dot to read the chain behind it.</p>
            )}
          </section>
        </section>
        {/* The word "verifier" is new to the deck here, so the margin carries the
            mechanics the prose above does not stop for, and the cite for the
            technique that used to sit in the footer. */}
        <Note kicker="What the verifier does">
          <p>
            It reads the problem and one finished candidate and returns a single number. Best-of-N
            keeps the candidate with the highest one. It writes nothing, and it never sees the
            tally, so whatever it buys is not counting in disguise.
          </p>
          <p>
            Cited for the technique, training a verifier and selecting among N sampled solutions.
            The numbers on this page are our own.
          </p>
          <RefItem n={REF.cobbe} href="https://arxiv.org/abs/2110.14168" preprint>
            Cobbe et al. 2021, <em>Training Verifiers to Solve Math Word Problems</em> (arXiv
            2110.14168).
          </RefItem>
        </Note>

        {/* Step 2 — what each rule fixed and broke */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. What each rule fixed, and what it broke</h2>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            {/* The fact the whole page rests on, and the reason the rows may be
                compared to each other at all. */}
            <Pills
              items={["measured", `${PAGE8.paired.items} problems`, "every rule reads the same chains"]}
            />
            <PairedFigure />
            <figcaption className="text-sm text-ink-muted">
              Every rule against the same single chain, on the same {PAGE8.paired.items} problems,
              tested where the two disagree. The trained verifier fixes{" "}
              <strong className="text-ink">{PAGE8.headline.fixed}</strong> and breaks{" "}
              <strong className="text-ink">{PAGE8.headline.broke}</strong>. And{" "}
              <strong className="text-ink">the heuristic scorer from the source we build on</strong>
              {PAGE8.heuristic ? (
                <>
                  {" "}
                  breaks {PAGE8.heuristic.broke} and fixes only {PAGE8.heuristic.fixed}: every
                  candidate here ends in a boxed answer, so its boxed bonus cancels and the rule
                  reduces to <em>shortest wins</em>. A judge that grades presentation is worse than
                  not choosing at all.
                </>
              ) : null}
            </figcaption>
          </figure>
        </section>
        <Note kicker="The vote is on this axis too">
          <p>
            Counting fixes {PAGE8.majority.fixed} and breaks {PAGE8.majority.broke}, {" "}
            {pValue(PAGE8.majority.p)}. It clears the same bar, for free.
          </p>
          {/* Page 7's handoff used to claim these were page 7's own chains. They
              are not, and the receipt for what is actually true is better than
              the claim it replaces. */}
          <p>
            That vote is page 7&apos;s rule re-run here, on chains this page generated itself: at
            the same temperature and {PAGE8.agreement.n} candidates it reads{" "}
            {pct(PAGE8.agreement.page8Vote)} against page 7&apos;s {pct(PAGE8.agreement.page7Vote)},
            with a right answer somewhere in the pile on {pct(PAGE8.agreement.page8Coverage)} of
            problems both times. Different chains, same place.
          </p>
        </Note>

        {/* Step 3 — what a judge is worth */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. What a judge is worth</h2>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            {/* Each point is an average, so the pill says what it averages over
                before the reader reads a bar as an error. */}
            <Pills
              items={[
                "measured",
                `${PAGE8.judges.length} judges`,
                `${PAGE8.run.temperatures.length} temperatures each`,
              ]}
            />
            <JudgeFigure />
            <figcaption className="text-sm text-ink-muted">
              Five judges spanning size, subject and training objective, each averaged over four
              temperatures with the bar spanning its best and worst.{" "}
              <strong className="text-ink">Being good at the problems is not being good at judging them</strong>
              : on this run the best solver on the ladder ranked last as a judge, and the only judge
              whose mean sits above the vote is the{" "}
              <strong className="text-correct">{trained?.label}</strong>, which cannot solve a
              single one of these problems, because it was trained to score rather than to answer.{" "}
              {PAGE8.claims.judge_ranking_resolved ? null : (
                <>
                  Read the ordering as a pattern and not a ranking: the bars overlap, no pair of
                  judges here is resolved at this sample, and that is why this is the one comparison
                  on the page with no p-value beside it.
                </>
              )}
            </figcaption>
          </figure>
        </section>
        <Note kicker="A verifier, not a PRM">
          <p>
            The trained one is{" "}
            <span className="font-mono text-xs">{PAGE8.verifierNote?.model ?? trained?.name}</span>,
            a process reward model read at the final token only: one number for the whole solution.
            It is here as a <em>trained verifier</em>. Grading the steps is the next page.
          </p>
        </Note>

        {/* Step 4 — the handoff */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. Where this leaves us</h2>
          <div className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <p>
              Selection works. Against the same candidates, so does counting: the verifier is{" "}
              <strong>{PAGE8.caveat.net > 0 ? `+${PAGE8.caveat.net}` : PAGE8.caveat.net}</strong>{" "}
              problems ahead of the vote, {pValue(PAGE8.caveat.p)}, which is not a difference. Two
              routes to the same place, and one of them is free.
            </p>
            {/* Page 7 closed on the right answers the vote threw away and handed
                this page the question. Answered here in the numbers both figures
                already draw, before the pivot that the answer motivates. */}
            {PAGE8.coverage !== null && trained ? (
              <p>
                And page 7&apos;s leftovers are still mostly leftovers. A right answer was in the
                pile on <strong>{pct(PAGE8.coverage)}</strong> of problems, and on the problems where
                one exists the vote returns it {pct(PAGE8.bar.mean)} of the time against the trained
                verifier&apos;s {pct(trained.mean)}. Judging recovers a little of what counting
                discarded, not most of it.
                <Cite n={REF.stroebl} />
              </p>
            ) : null}
            <p className="text-ink-muted">
              So the question is not how many candidates, nor even how good the judge is, but{" "}
              <em>what the judge is reading</em>. Every rule here grades the final answer and none
              of them looks at whether step three followed from step two.{" "}
              <em>Turn the page.</em>
            </p>
          </div>
        </section>
        {/* The one disclosure the retired footer held that lives nowhere else:
            whose comparison this is. It belongs beside the sentence that makes
            it, not under the page. */}
        <Note kicker="Whose comparison this is">
          <p>
            Cited for the shape behind the two recovery numbers beside it: an imperfect judge asked
            to pick from more and more candidates eventually reads its own noise. The measurement is
            ours.
          </p>
          <p>
            So is the comparison. Counting against selection is not a contest anyone else ran here:
            self-consistency and best-of-N are introduced in different chapters of the source we
            build on and are never set against each other there.
          </p>
          <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501" preprint>
            Stroebl et al. 2024, <em>Inference Scaling fLaws: The Limits of LLM Resampling with
            Imperfect Verifiers</em> (arXiv 2411.17501).
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}

export default Page8;
