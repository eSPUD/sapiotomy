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
 * with it.
 */

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { CitationBadge } from "@/components/CitationBadge";
import { PageNav } from "@/components/PageNav";
import type { Citation } from "@/lib/data";
import { PAGE8, pValue, pct, tidyMath } from "@/lib/page08";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 8;
const NOTEBOOK_ZIP = "/notebooks/page-08-best-of-n.zip";

const COBBE: Citation = {
  ref: "Cobbe et al. 2021",
  url: "https://arxiv.org/abs/2110.14168",
  venue: "arXiv",
  preprint: true,
};

const STROEBL: Citation = {
  ref: "Stroebl et al. 2024",
  url: "https://arxiv.org/abs/2411.17501",
  venue: "arXiv",
  preprint: true,
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

const PAIR_W = 620;
const PAIR_ROW = 30;
const PAIR_M = { top: 26, right: 96, bottom: 34, left: 148 };

/**
 * Fixed to the right of zero, broken to the left, one row per rule, against
 * the same single-chain baseline on the same problems. The one row whose mass
 * sits left of zero is ch05's presentation-grading scorer.
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
      xLabel={`problems, against one chain · ${PAGE8.paired.items} problems, N=${PAGE8.paired.n}`}
      title={
        `For each selection rule, how many problems it fixed and how many it broke compared ` +
        `with taking a single chain. The trained verifier fixed ${PAGE8.headline.fixed} and ` +
        `broke ${PAGE8.headline.broke}. ch05's heuristic scorer is the only rule that broke ` +
        `more than it fixed.`
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
              {r.selector}
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
        `over four temperatures. The points do not trend. The only judge above the majority ` +
        `line is the trained verifier, which cannot solve any of these problems itself.`
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
              {j.name}
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
        Counting asks what is most common. Judging asks what is best. They are not the same
        question, and on {PAGE8.run.items} problems{" "}
        <strong className="text-ink">
          scoring {PAGE8.paired.n} candidates and keeping the best takes {pct(PAGE8.oneChain)} to{" "}
          {pct(PAGE8.headline.accuracy)}
        </strong>{" "}
        — {PAGE8.headline.fixed} problems fixed against {PAGE8.headline.broke} broken,{" "}
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
            <p className="text-sm text-ink">{tidyMath(s.question)}</p>
            <p className="text-xs text-ink-muted">
              {s.n} chains. The vote takes the longest row:{" "}
              <strong className="text-wrong">
                {tidyMath(s.vote.answer ?? "no answer")} on {s.vote.votes} of {s.n}
              </strong>
              , and it is wrong. The verifier takes the rightmost dot:{" "}
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
              The vote dips below one chain at N=2 and that is the rule, not noise:{" "}
              <strong className="text-ink">with two candidates any disagreement is a tie</strong>,
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
        <Note kicker="Same batch, two rules">
          <p>
            Both panels read the same {s.n} chains. Only the rule for choosing differs, so every
            difference is the rule.
          </p>
        </Note>

        {/* Step 2 — what each rule fixed and broke */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. What each rule fixed, and what it broke</h2>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            <PairedFigure />
            <figcaption className="text-sm text-ink-muted">
              Every rule against the same single chain, on the same {PAGE8.paired.items} problems,
              tested where the two disagree. The trained verifier fixes{" "}
              <strong className="text-ink">{PAGE8.headline.fixed}</strong> and breaks{" "}
              <strong className="text-ink">{PAGE8.headline.broke}</strong>. And{" "}
              <strong className="text-ink">ch05&apos;s own heuristic scorer</strong>
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
        </Note>

        {/* Step 3 — what a judge is worth */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. What a judge is worth</h2>
          <figure className="m-0 flex min-w-0 flex-col gap-3 rounded-lg border-l-4 border-grid bg-surface p-4">
            <JudgeFigure />
            <figcaption className="text-sm text-ink-muted">
              Five judges spanning size, subject and training objective, each averaged over four
              temperatures with the bar spanning its best and worst.{" "}
              <strong className="text-ink">Being good at the problems is not being good at judging them</strong>
              : the best solver on this ladder is the worst judge on it. The only judge above the
              vote is{" "}
              <strong className="text-correct">{trained?.name}</strong>, which cannot solve a single
              one of these problems, because it was trained to score rather than to answer.
            </figcaption>
          </figure>
        </section>
        <Note kicker="A verifier, not a PRM">
          <p>
            {trained?.name} is a process reward model read at the final token only: one number for
            the whole solution. It is here as a <em>trained verifier</em>. Grading the steps is the
            next page.
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
            <p className="text-ink-muted">
              So the question is not how many candidates, nor even how good the judge is, but{" "}
              <em>what the judge is reading</em>. Every rule here grades the final answer and none
              of them looks at whether step three followed from step two.{" "}
              <em>Turn the page.</em>
            </p>
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CitationBadge citation={COBBE} />
        <CitationBadge citation={STROEBL} />
        <a
          className="rounded border border-grid px-2 py-1 text-xs text-ink-muted hover:text-ink"
          href={NOTEBOOK_ZIP}
          download
        >
          notebook + {PAGE8.run.chains.toLocaleString()} traces ↓
        </a>
      </div>

      <p className="text-xs text-ink-muted">
        measured · {PAGE8.run.model} · {PAGE8.run.items} MATH-500 level 4-5 problems ·{" "}
        {PAGE8.run.chains.toLocaleString()} chains at {PAGE8.run.chainCap} tokens across
        temperatures {PAGE8.run.temperatures.join(", ")} · {PAGE8.run.date} · every selection rule
        reads the same candidates, which is the fact the whole page rests on · differences are
        exact McNemar tests over the problems where two rules disagree · Cobbe et al. 2021 is cited
        for the technique, training a verifier and selecting among N sampled solutions, and
        Stroebl et al. 2024 for the shape of the imperfect-verifier limit; the numbers here are our
        own · the comparison between counting and selection is ours too: self-consistency and
        best-of-N are introduced in different chapters of the source we build on and are never set
        against each other there
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}

export default Page8;
