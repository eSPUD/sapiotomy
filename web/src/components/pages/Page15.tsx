"use client";

/**
 * Page 15, "When Reasoning Breaks". Act 3's candour page: the compute knob has
 * a wrong side. Three failure modes, in the order the title names them. It
 * briefly closed the deck after the 2026-08-10 cut and no longer does; page 16
 * wraps up, and this page hands its open question forward rather than ending on
 * it.
 *
 * This was page 17 until the scoreboard, economics, faithfulness and frontier
 * pages came out. Its instrument did not move with it, so `lib/page17.ts`,
 * `data/page-17-derived.json` and `page_17_when_reasoning_breaks.ipynb` keep
 * their old names: those are provenance identifiers for one notebook run, not
 * route numbers. PROVENANCE.md records the pairing.
 *
 * Step 1 is verbatim published data (Huang et al., ICLR 2024, Table 3): asked
 * to re-check its own reasoning with no new information, a model gets WORSE.
 *
 * Steps 2 and 3 were an authored Markov chain and an authored inverse-U until
 * `page_17_when_reasoning_breaks.ipynb` re-read pages 5 to 9. Both are now the
 * deck's own runs (lib/page17.ts), and what replaced them is smaller than what
 * they claimed, which is the point of the page.
 *
 * Step 2 is page 6's budget sweep with the losses drawn back in. Its centre is
 * ONE problem: right when cut off and made to commit, wrong when allowed to
 * finish, and its mistake is an unjustified symmetry assumption a reader can
 * check. THE SPECIMEN MUST NOT TRAVEL WITHOUT ITS THREE CONTROLS, which are on
 * screen beside it and are the reason the beat is honest. The cut chain had not
 * derived anything (0 of 25 rescues had concluded); the model did not simply
 * know the answer (page 5's blurt arm gets 6 of 16); and stopping early is not
 * a strategy, because a fixed cut is worse than finishing and the best cut buys
 * no more coverage per token than plain resampling. Without those three a
 * reader leaves with a technique that does not exist. The figure earns them:
 * at the middle cuts the bad assumption is already written and the forced
 * commit ignores it, which is control 1 drawn rather than asserted.
 *
 * The old step 3 asserted that easy problems cross an overthinking threshold
 * before hard ones. Pooled over three checkpoints our own run puts both medians
 * at the same budget, and the budget axis cannot carry the claim anyway: under
 * greedy decoding a chain that has stopped itself is not rerun at a larger
 * budget. The claim is deleted rather than softened; docs/page_17_findings.md
 * section 4 is why, and the loader keeps it reachable as a stated null.
 *
 * Step 3 is now the verifier, measured twice. Reliability falls with the very
 * temperature that makes best-of-N worth running, and only the judge trained to
 * score stays flat, so the figure is a crossing and must be read left to right.
 * Then the quieter coordinate: 94.2% of the steps in 1,580 real chains state
 * nothing a checker can compute, and the reward model's quality figures were
 * taken inside the other 5.8%.
 *
 * Step 4 is the balance: what still works, and the contamination caveat, which
 * discounts every accuracy number in Acts 2 and 3 and is therefore a callout
 * rather than a trailing muted line.
 */

import { useMemo, useState } from "react";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { PAGE17, pct, tidyMath } from "@/lib/page17";
import { pLabel, WAIT_TABLE } from "@/lib/page06";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;

/** Page 15's references, numbered in order of first appearance. */
const REF = { huang: 1, zeng: 2, wang: 3, stroebl: 4, balachandran: 5 } as const;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/** One model × benchmark panel of the Huang et al. Table 3 bars. */
function SelfCorrectPanel({
  heading,
  rows,
}: {
  heading: string;
  rows: { label: string; value: number; broke: boolean }[];
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-3"
      role="img"
      aria-label={`${heading}: ${rows.map((r) => `${r.label} ${r.value} percent`).join(", ")}`}
    >
      <p className="text-sm font-semibold text-ink">{heading}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 text-sm">
          <span className="w-28 shrink-0 text-ink-muted">{r.label}</span>
          <div className="h-5 flex-1 rounded bg-surface">
            <div
              className={`h-5 rounded ${r.broke ? "bg-wrong" : "bg-correct"}`}
              style={{ width: `${r.value}%` }}
            />
          </div>
          <span className="w-12 shrink-0 text-right font-mono tabular-nums text-ink">
            {r.value.toFixed(1)}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ step 2a */

const L_W = 640;
const L_H = 210;
const L_M = { top: 18, right: 16, bottom: 40, left: 56 };
const L_IW = L_W - L_M.left - L_M.right;
const L_IH = L_H - L_M.top - L_M.bottom;

const LEDGER = PAGE17.ledger.primary;
const L_MAX = Math.max(...LEDGER.map((r) => Math.max(r.gained, r.lost)));
const L_ZERO = (L_IH * L_MAX) / (L_MAX + Math.max(...LEDGER.map((r) => r.lost)) * 1.6);

/**
 * What page 6's curve is the difference of. Gains rise from the baseline, losses
 * hang below it, so the thing the reader is meant to notice is that no rung is
 * clean: there is a red stub under every one of them, including the two that
 * look like unambiguous wins.
 *
 * The last rung is drawn like the others and captioned differently, because its
 * emptiness is a fact about the axis rather than about the model.
 */
function RungLedger({ active }: { active: number }) {
  const band = L_IW / LEDGER.length;
  const activeRung = active > 0 ? LEDGER[active - 1] : null;
  return (
    <ChartFrame
      title={`Answers gained and lost at each doubling of the token budget, on ${PAGE17.run.items} problems at ${PAGE17.run.primaryLabel}. ${LEDGER.map(
        (r) => `${r.from_budget} to ${r.to_budget} tokens: ${r.gained} gained, ${r.lost} lost`,
      ).join(". ")}. Every rung loses answers.`}
      width={L_W}
      height={L_H}
      margin={L_M}
      yLabel="answers"
    >
      <line x1={0} x2={L_IW} y1={L_ZERO} y2={L_ZERO} className="stroke-ink-muted" strokeWidth={1} />
      {LEDGER.map((r, i) => {
        const cx = i * band + band / 2;
        const up = (r.gained / L_MAX) * (L_ZERO - 6);
        const down = (r.lost / L_MAX) * (L_IH - L_ZERO - 14);
        const on = activeRung === r;
        return (
          <g key={r.to_budget} opacity={activeRung === null || on ? 1 : 0.45}>
            <rect
              x={cx - 26}
              y={L_ZERO - up}
              width={52}
              height={up}
              className="fill-correct"
              opacity={on ? 1 : 0.75}
            />
            <rect
              x={cx - 26}
              y={L_ZERO}
              width={52}
              height={down}
              className="fill-wrong"
              opacity={on ? 1 : 0.75}
            />
            {r.gained > 0 ? (
              <text
                x={cx}
                y={L_ZERO - up - 5}
                textAnchor="middle"
                className="fill-ink text-[11px] font-semibold"
              >
                +{r.gained}
              </text>
            ) : (
              <text x={cx} y={L_ZERO - 6} textAnchor="middle" className="fill-ink-muted text-[11px]">
                nothing gained
              </text>
            )}
            <text
              x={cx}
              y={L_ZERO + down + 12}
              textAnchor="middle"
              className="fill-wrong text-[11px] font-semibold"
            >
              &minus;{r.lost}
            </text>
            <text
              x={cx}
              y={L_IH + 16}
              textAnchor="middle"
              className={`text-[10px] ${on ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {r.from_budget} to {r.to_budget}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ step 2b */

type Seg = { text: string; tone: "plain" | "wrong" | "commit" } | { elided: number };

/**
 * Fold a chain down to what is worth reading: a head, the spans that carry the
 * argument, and an honest count of the characters dropped between them. The
 * elision has to state its size, or a reader cannot tell a tidy chain from a
 * cropped one.
 */
function fold(
  trace: string,
  marks: { span: [number, number]; tone: "wrong" | "commit" }[],
  head = 200,
  pad = 96,
): Seg[] {
  // Snap a cut to the nearest space, or the fold lands mid-word and the elision reads
  // as a rendering fault rather than as an omission.
  const snap = (i: number, dir: 1 | -1): number => {
    for (let k = 0; k < 40; k++) {
      const j = i + dir * k;
      if (j <= 0) return 0;
      if (j >= trace.length) return trace.length;
      if (/\s/.test(trace[j])) return j;
    }
    return i;
  };
  const keep: [number, number][] = [[0, snap(Math.min(head, trace.length), -1)]];
  for (const m of marks) {
    keep.push([
      snap(Math.max(0, m.span[0] - pad), -1),
      snap(Math.min(trace.length, m.span[1] + pad), 1),
    ]);
  }
  keep.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of keep) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r] as [number, number]);
  }

  const out: Seg[] = [];
  let cursor = 0;
  for (const [s, e] of merged) {
    if (s > cursor) out.push({ elided: s - cursor });
    // Split this kept range around whichever marks fall inside it.
    let at = s;
    for (const m of marks.filter((m) => m.span[0] >= s && m.span[0] < e).sort((a, b) => a.span[0] - b.span[0])) {
      if (m.span[0] > at) out.push({ text: trace.slice(at, m.span[0]), tone: "plain" });
      out.push({ text: trace.slice(m.span[0], Math.min(m.span[1], e)), tone: m.tone });
      at = Math.min(m.span[1], e);
    }
    if (at < e) out.push({ text: trace.slice(at, e), tone: "plain" });
    cursor = e;
  }
  if (cursor < trace.length) out.push({ elided: trace.length - cursor });
  return out;
}

const SP = PAGE17.specimen;

/**
 * One problem, one chain, the budget on a dial.
 *
 * The reveal the figure is built for is not "short is better". It is that the
 * bad assumption is ALREADY on screen at 256 and 512 tokens and the model
 * commits to the right answer anyway, then commits to the assumption's result
 * once allowed to finish. That is control 1 drawn rather than asserted: the
 * answer is coming from the commit, not from the working above it.
 */
function SpecimenChain({ budgetIndex }: { budgetIndex: number }) {
  const row = SP.byBudget[budgetIndex];
  const isEnd = !row.truncated;
  const written = SP.zones.assumption[1] <= row.trace.length;
  const segs = useMemo(() => {
    const marks: { span: [number, number]; tone: "wrong" | "commit" }[] = [];
    // The assumption is lit wherever it has been written, which at the middle cuts
    // means it is on screen AND ignored by the commit below it. That is control 1
    // drawn rather than asserted.
    if (SP.zones.assumption[1] <= row.trace.length) {
      marks.push({ span: SP.zones.assumption, tone: "wrong" });
    }
    if (!row.truncated) {
      marks.push({ span: SP.zones.conclusion, tone: "wrong" });
    } else if (row.commit !== null) {
      marks.push({ span: [row.commit, row.trace.length], tone: "commit" });
    }
    return fold(row.trace, marks);
  }, [row.trace, row.truncated, row.commit]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {isEnd
            ? `its own ending, ${row.own_tokens} tokens`
            : `cut at ${row.budget} tokens, then made to commit`}
        </p>
        <p className={`text-sm font-semibold ${row.correct ? "text-correct" : "text-wrong"}`}>
          answered <span className="font-mono">{tidyMath(row.extracted_answer ?? "")}</span>,{" "}
          {row.correct ? "right" : "wrong"}
        </p>
      </div>
      <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-ink-muted">
        {segs.map((s, i) =>
          "elided" in s ? (
            <span key={i} className="mx-1 rounded bg-surface px-1 text-[10px] not-italic text-ink-muted">
              [{s.elided.toLocaleString()} more characters of working]
            </span>
          ) : (
            <span
              key={i}
              className={
                s.tone === "wrong"
                  ? "rounded bg-wrong/20 px-0.5 text-ink"
                  : s.tone === "commit"
                    ? "rounded bg-correct/20 px-0.5 text-ink"
                    : undefined
              }
            >
              {tidyMath(s.text)}
            </span>
          ),
        )}
      </p>
      {written ? (
        <p className="text-xs text-ink-muted">
          Lit in red: {SP.zones.why}.
          {!isEnd
            ? " It is already written, and the forced commit below ignores it."
            : " The box at the end is what it carries the assumption to."}
        </p>
      ) : (
        <p className="text-xs text-ink-muted">
          Cut before it makes its mistake. The assumption that costs it has not been written yet.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ step 3a */

const R_W = 700;
const R_H = 300;
const R_M = { top: 24, right: 196, bottom: 46, left: 52 };
const R_IW = R_W - R_M.left - R_M.right;
const R_IH = R_H - R_M.top - R_M.bottom;

const REL = PAGE17.reliability;
const T_MIN = REL.temperatures[0];
const T_MAX = REL.temperatures[REL.temperatures.length - 1];
const rx = (t: number) => ((t - T_MIN) / (T_MAX - T_MIN)) * R_IW;
const ry = (r: number) => R_IH - r * R_IH;

/**
 * Push overlapping right-hand labels apart. Three selectors land within a point
 * of each other at the hottest column, and stacked-on-top-of-each-other labels
 * would read as a rendering fault rather than as a tie.
 */
function dodge(ys: number[], gap = 13): number[] {
  const order = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < order.length; i++) {
    if (order[i].y - order[i - 1].y < gap) order[i].y = order[i - 1].y + gap;
  }
  const out = new Array<number>(ys.length);
  for (const o of order) out[o.i] = o.y;
  return out;
}

/**
 * Reliability against the temperature that buys candidate diversity, every line
 * measured at one candidate depth so temperature is the only thing moving.
 *
 * The claim is a CROSSING and not a column: at the coldest setting the trained
 * reward model is mid-pack, and by the hottest it leads every model-as-judge by
 * a wide margin, because it is the only line that does not decay. So the figure
 * is built to be read left to right. The widening wedge between the trained line
 * and the best model-judge is drawn as area, which is the comparison the reader
 * would otherwise have to do four times by eye, and the full 0 to 100 axis is
 * kept rather than zoomed because "no judge here is anywhere near perfect" is
 * also page 17's point.
 */
function ReliabilitySweep() {
  const trained = REL.trained;
  const others = REL.lines.filter((l) => !l.trained);
  // The wedge's lower edge: the best model-judge at each temperature, which is
  // the fairest thing to charge the trained line against.
  const bestOther = REL.temperatures.map((t, i) =>
    Math.max(...others.map((o) => o.points[i].reliability)),
  );
  const labelYs = dodge(REL.lines.map((l) => ry(l.points[l.points.length - 1].reliability)));

  return (
    <ChartFrame
      title={`Reliability of five ways of picking an answer, against sampling temperature, all measured over ${REL.depth} candidates. ${REL.lines
        .map(
          (l) =>
            `${l.label}: ${l.points.map((p) => `${pct(p.reliability)} at temperature ${p.temperature}`).join(", ")}`,
        )
        .join(". ")}. Every judge that is a model asked to judge decays; the trained reward model does not.`}
      width={R_W}
      height={R_H}
      margin={R_M}
      xLabel="sampling temperature, the knob that buys candidate diversity"
      yLabel="reliability (%)"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={0} x2={R_IW} y1={ry(t)} y2={ry(t)} className="stroke-grid" strokeWidth={1} />
          <text x={-8} y={ry(t) + 4} textAnchor="end" className="fill-ink-muted text-[10px]">
            {t * 100}
          </text>
        </g>
      ))}

      {/* The gap the trained model opens up, as area rather than as four subtractions.
          It is a sliver at the cold end and a wedge at the hot end, and it inverts at
          the left because the vote is genuinely ahead there. That inversion is the
          crossing, so it is drawn rather than tidied away. */}
      <polygon
        className="fill-compute opacity-[0.16]"
        points={[
          ...REL.temperatures.map((t, i) => `${rx(t)},${ry(trained.points[i].reliability)}`),
          ...REL.temperatures.map((t, i) => `${rx(t)},${ry(bestOther[i])}`).reverse(),
        ].join(" ")}
      />

      {/* The wedge alone is a shape; this gives it a number, at the column where the
          page's sentence is read. */}
      <g>
        <line
          x1={rx(T_MAX) - 16}
          x2={rx(T_MAX) - 16}
          y1={ry(trained.points[trained.points.length - 1].reliability)}
          y2={ry(bestOther[bestOther.length - 1])}
          className="stroke-compute"
          strokeWidth={1.5}
        />
        <text
          x={rx(T_MAX) - 22}
          y={
            (ry(trained.points[trained.points.length - 1].reliability) +
              ry(bestOther[bestOther.length - 1])) /
            2
          }
          textAnchor="end"
          className="fill-compute text-[10px] font-semibold"
        >
          {(
            (trained.points[trained.points.length - 1].reliability -
              bestOther[bestOther.length - 1]) *
            100
          ).toFixed(0)}{" "}
          points clear
        </text>
      </g>

      {REL.temperatures.map((t) => (
        <text
          key={t}
          x={rx(t)}
          y={R_IH + 16}
          textAnchor="middle"
          className="fill-ink-muted text-[11px]"
        >
          {t.toFixed(1)}
        </text>
      ))}

      {REL.lines.map((line) => (
        <g key={line.selector}>
          <polyline
            fill="none"
            className={line.trained ? "stroke-compute" : "stroke-ink-muted"}
            strokeWidth={line.trained ? 2.5 : 1.25}
            strokeOpacity={line.trained ? 1 : 0.75}
            points={line.points.map((p) => `${rx(p.temperature)},${ry(p.reliability)}`).join(" ")}
          />
          {line.points.map((p) => (
            <circle
              key={p.temperature}
              cx={rx(p.temperature)}
              cy={ry(p.reliability)}
              r={line.trained ? 3.5 : 2}
              className={line.trained ? "fill-compute" : "fill-ink-muted"}
            />
          ))}
        </g>
      ))}

      {REL.lines.map((line, i) => (
        <g key={`label-${line.selector}`}>
          <line
            x1={R_IW}
            x2={R_IW + 8}
            y1={ry(line.points[line.points.length - 1].reliability)}
            y2={labelYs[i]}
            className={line.trained ? "stroke-compute" : "stroke-grid"}
            strokeWidth={1}
          />
          <text
            x={R_IW + 12}
            y={labelYs[i] + 3}
            className={`text-[10px] ${line.trained ? "fill-compute font-semibold" : "fill-ink-muted"}`}
          >
            {line.label}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ step 3b */

const S_W = 640;
const S_H = 168;
const S_M = { top: 40, right: 16, bottom: 44, left: 16 };
const S_IW = S_W - S_M.left - S_M.right;

/**
 * Where the process grader's quality figures were taken. One bar, every step of
 * 1,580 real chains, split at what an arithmetic checker can adjudicate.
 *
 * The figure exists because the sliver has to be seen at true width to land: a
 * table row reading "5.8%" is a number, and a strip this thin next to the rest
 * of the bar is an argument. The reward model's AUC is drawn INSIDE the sliver
 * rather than beside the bar, because where it was measured is the whole claim.
 */
function ReadableSliver() {
  const readable = PAGE17.readable;
  const share = 1 - readable.shareUnjudged;
  const w = Math.max(share * S_IW, 3);
  const prm = readable.prm;
  return (
    <ChartFrame
      title={`Of ${readable.stepsTotal.toLocaleString()} steps across 1,580 chains, an arithmetic checker can adjudicate ${readable.stepsJudged.toLocaleString()}, or ${pct(share, 1)}. The remaining ${pct(readable.shareUnjudged, 1)} state nothing it can compute.${prm ? ` The process reward model's AUC of ${prm.auc.toFixed(2)} was measured inside that ${pct(share, 1)}.` : ""}`}
      width={S_W}
      height={S_H}
      margin={S_M}
    >
      <rect x={0} y={0} width={S_IW} height={44} className="fill-ink opacity-[0.07]" />
      <rect x={0} y={0} width={w} height={44} className="fill-correct" />

      {/* The leader has to come from outside: nothing legible fits in the sliver. */}
      <line x1={w / 2} x2={w / 2} y1={-14} y2={0} className="stroke-correct" strokeWidth={1} />
      <text x={w / 2 - 2} y={-20} className="fill-ink text-[11px] font-semibold">
        {pct(share, 1)} checkable
      </text>
      <text x={S_IW - 4} y={26} textAnchor="end" className="fill-ink text-[12px] font-semibold">
        {pct(readable.shareUnjudged, 1)} prose: nothing a checker can compute
      </text>

      {prm ? (
        <>
          <path
            d={`M0,58 L0,66 L${w},66 L${w},58`}
            fill="none"
            className="stroke-ink-muted"
            strokeWidth={1}
          />
          <text x={0} y={82} className="fill-ink-muted text-[11px]">
            the reward model&apos;s AUC of {prm.auc.toFixed(2)}, its recall of{" "}
            {pct(prm.recallOnFalse, 0)} and its specificity of {pct(prm.specificityOnTrue, 0)} were
            all measured in here
          </text>
        </>
      ) : null}
    </ChartFrame>
  );
}

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const huang = curves.selfCorrection;
  const h = huang.fit!.params;

  const [budgetIndex, setBudgetIndex] = useState(0);

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
        For fourteen pages the dial has mostly pointed one way: more samples, deeper search, longer
        chains, more accuracy. This page is the fine print. Left alone, models{" "}
        <strong className="text-ink">cannot reliably fix their own mistakes</strong>, thinking
        longer can <strong className="text-ink">subtract</strong> accuracy, and the verifiers doing
        the rescuing are fallible themselves.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — intrinsic self-correction fails */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Marking its own homework
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              verbatim published numbers
            </span>
          </h2>
          <div className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              The obvious fix for a wrong answer is to ask the model to look it over and correct any
              mistakes: no hints, no tools, just re-reading. Measured across two rounds of exactly
              that, accuracy goes <strong>down</strong>:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelfCorrectPanel
                heading="GPT-4 · GSM8K"
                rows={[
                  { label: "first answer", value: h.gpt4Gsm8k0, broke: false },
                  { label: "after 1 round", value: h.gpt4Gsm8k1, broke: true },
                  { label: "after 2 rounds", value: h.gpt4Gsm8k2, broke: true },
                ]}
              />
              <SelfCorrectPanel
                heading="GPT-3.5 · CommonSenseQA"
                rows={[
                  { label: "first answer", value: h.gpt35Csqa0, broke: false },
                  { label: "after 1 round", value: h.gpt35Csqa1, broke: true },
                  { label: "after 2 rounds", value: h.gpt35Csqa2, broke: true },
                ]}
              />
            </div>
            <p className="text-sm text-ink-muted">
              The reason is structural: the same weights that produced the error are asked to find
              it, so the review mostly re-approves the answer, and when the model does change
              something, it flips correct answers to wrong{" "}
              <em>more often than the reverse</em>.
              <Cite n={REF.huang} /> Nothing new enters the system; &ldquo;are you
              sure?&rdquo; just adds noise, and on CommonSenseQA one round of it cost GPT-3.5 half
              its score.
            </p>
            <p className="border-t border-dashed border-grid pt-3 text-sm text-ink-muted">
              We ran the gentler version. Page 6 refused to let its models stop, appending{" "}
              <span className="font-mono text-ink">Wait</span> and making them carry on: a
              reconsideration rather than a re-read. It moved {pct(WAIT_TABLE!.churn)} of the
              answers and cost {WAIT_TABLE!.tokenMultiple.toFixed(1)}× the tokens, turning{" "}
              {WAIT_TABLE!.table.afterOnly} wrong answers right against{" "}
              {WAIT_TABLE!.table.beforeOnly} right ones wrong.{" "}
              <strong className="text-ink">No checkpoint resolves its crossing</strong> ({pLabel(WAIT_TABLE!.p)}),
              so ours is a null rather than a confirmation. The paper says review makes it worse;
              we measured that the gentler form mostly churns. Both rule out asking again.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.huang} href="https://arxiv.org/abs/2310.01798">
            Huang et al. 2024, <em>Large Language Models Cannot Self-Correct Reasoning Yet</em>{" "}
            (ICLR 2024), Table 3. &ldquo;Round&rdquo; = the model is shown its own answer and asked
            to review and revise it, with no external feedback.
          </RefItem>
        </Note>

        {/* Step 2 — what the climbing curve netted out */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. What the climbing curve netted out
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              our run · {PAGE17.run.items} problems · {PAGE17.run.primaryLabel} · greedy
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-sm text-ink">
              Step 1 held the model to a re-read, which is why nothing new could be solved. Loosen
              that: give it more room to think and let it write fresh working. Page 6 did exactly
              this and its accuracy curve climbs. That curve is a <strong>net</strong>. Here are the two numbers it is the difference of.
            </p>

            <div className="flex flex-col gap-3">
              <Slider
                label="Token budget"
                min={0}
                max={PAGE17.run.budgets.length - 1}
                value={budgetIndex}
                format={(i) => `${PAGE17.run.budgets[i]} tokens`}
                onChange={(v) => {
                  setBudgetIndex(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <RungLedger active={budgetIndex} />
              <p className="text-sm text-ink-muted">
                Every rung loses answers as well as gaining them, and those losses were never
                drawn until now. The top rung gains{" "}
                <strong className="text-ink">nothing</strong>, and not because thinking longer
                stopped working: under greedy decoding a chain that has already stopped itself is
                not run again at a larger budget, it is the same generation.{" "}
                {pct(PAGE17.axisBound.shareSelfTerminated, 0)} of these end themselves before{" "}
                {PAGE17.axisBound.maxBudget} tokens. The axis runs out before the model does.
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-dashed border-grid pt-4">
              <p className="text-sm text-ink">
                So look at one of the losses. Drag the budget and watch a single problem:{" "}
                <span className="font-mono text-xs text-ink-muted">{PAGE17.specimen.shortId}</span>,
                minimise <em>(x+y)(y+z)</em> given <em>xyz(x+y+z) = 1</em>. The answer is{" "}
                {PAGE17.specimen.groundTruth}.
              </p>
              <SpecimenChain budgetIndex={budgetIndex} />
              <p className="text-sm text-ink-muted">
                Cut at {PAGE17.specimen.rightWhenCutAt.join(", ")} tokens and forced to commit, it
                answers {PAGE17.specimen.groundTruth} three times over. Allowed to run to its own{" "}
                {PAGE17.specimen.naturalLength}-token ending, it answers{" "}
                <span className="font-mono text-xs">{tidyMath(PAGE17.specimen.wrongAnswer ?? "")}</span>. The
                step that costs it is lit, and every line after it is correct arithmetic carrying a
                wrong assumption to a confident finish. It breaks on{" "}
                {PAGE17.specimen.alsoRegressesOn.join(" and ")} too.
              </p>
            </div>

            {/* The three controls. Each was run to break the specimen's story and each partly
                succeeded, so none of them is optional and none is a footnote. */}
            <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                three things this is not
              </p>
              <p className="text-sm text-ink">
                <strong>Not a truncated proof.</strong> Of all{" "}
                {PAGE17.controls.concludedWhenCut.cases} rescues like this in the run,{" "}
                {PAGE17.controls.concludedWhenCut.withAConclusion} had concluded anything when cut,
                against {pct(PAGE17.controls.concludedWhenCut.boxedWhenFinished, 0)} of chains
                allowed to finish. The answer came from the commit, which is why the figure shows
                the model writing its bad assumption and then ignoring it.
              </p>
              <p className="text-sm text-ink">
                <strong>Not the model already knowing.</strong> Page 5&apos;s zero-token blurt arm
                gets {PAGE17.controls.blurtArm.blurtRight} of these{" "}
                {PAGE17.controls.blurtArm.items} items. Partial working plus a commit does
                something neither end of that does alone.
              </p>
              <p className="text-sm text-ink">
                <strong>Not a strategy.</strong> Stopping every problem at{" "}
                {PAGE17.controls.isItARule.fixedCut} tokens scores{" "}
                {pct(PAGE17.controls.isItARule.fixedCutAccuracy, 0)} against{" "}
                {pct(PAGE17.controls.isItARule.natural, 0)} for finishing, and the best cut per
                problem reaches {pct(PAGE17.controls.isItARule.oracle, 0)} for about{" "}
                {Math.round(PAGE17.controls.isItARule.oracleTokenCost)} tokens where plain
                resampling reaches {pct(PAGE17.controls.isItARule.samplingCoverage, 0)} at the same
                cost. This is page 7&apos;s coverage without page 8&apos;s selector: a better
                answer is in the pile and nothing we tested finds it.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-center rounded-lg border border-grid bg-surface-raised p-4">
                <p className="text-sm text-ink-muted">
                  Problems the model talks itself out of, per {PAGE17.run.items}:
                </p>
                <div className="mt-2 flex items-end gap-4">
                  {PAGE17.affected.byModel.map((m) => (
                    <div key={m.model} className="flex flex-col items-center gap-1">
                      <span className="font-mono text-2xl font-bold tabular-nums text-wrong">
                        {m.rescued}
                      </span>
                      <span className="text-xs text-ink-muted">
                        {m.label.replace("Qwen2.5-", "").replace("-Instruct", "")}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-ink-muted">
                  The one aggregate claim here, and it is about capability rather than budgets: the
                  better the model, the less of this it does.
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-grid bg-surface-raised p-4">
                <p className="text-sm text-ink-muted">
                  If you had to guess right from wrong by length alone:
                </p>
                <p className="font-mono text-3xl font-bold tabular-nums text-compute">
                  {PAGE17.length.auc.toFixed(2)}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  Over page 8&apos;s whole pile, a correct candidate is the longer one about a
                  quarter of the time. Inverted, preferring the{" "}
                  <strong className="text-ink">shorter</strong> chain scores{" "}
                  {PAGE17.length.inverted.toFixed(2)}, beating {PAGE17.length.beats.length} of the
                  models that page asked to judge, at no cost. Wrong answers elsewhere burn ~225%
                  more tokens amid ~4× more strategy switches: thrashing, not depth.
                  <Cite n={REF.zeng} />
                  <Cite n={REF.wang} />
                </p>
              </div>
            </div>

          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Drag to {PAGE17.axisBound.maxBudget} and read what it commits to.</p>
          </Note>
          <Note kicker="What this axis cannot show">
            <p>
              It cannot show accuracy falling past a peak, only that some prefix beat the whole.
              Greedy decoding replays the same generation above the model&apos;s own stopping
              point, so nothing new happens up there.
            </p>
            <p>
              That bound retired a claim this page used to make: that easy problems cross an
              overthinking threshold before hard ones. Our run puts both medians at the same
              budget, and this instrument could not settle it at any sample size, so the claim is{" "}
              <strong className="text-ink">deleted rather than softened</strong>.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.zeng} href="https://arxiv.org/abs/2502.12215">
              Zeng et al. 2025, <em>Revisiting the Test-Time Scaling of o1-like Models</em> (ACL
              2025).
            </RefItem>
            <RefItem n={REF.wang} href="https://arxiv.org/abs/2501.18585" preprint>
              Wang et al. 2025, <em>Thoughts Are All Over the Place</em>.
            </RefItem>
            <RefItem n={REF.stroebl} href="https://arxiv.org/abs/2411.17501" preprint>
              Stroebl et al. 2024, <em>Inference Scaling fLaws</em>: the verifier ceiling, from
              page 8.
            </RefItem>
          </Note>
        </div>

        {/* Step 3 — the verifier's reliability is a coordinate, not a property */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. A verifier&apos;s reliability is a coordinate, not a property
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              our runs · the same {PAGE17.run.items} problems · pages 8 and 9
            </span>
          </h2>
          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              Step 2 leaned on a judge, and page 8 sold one: selection beats voting, up to the
              ceiling its reliability sets. That sentence quotes reliability as though it were a
              property of the judge. It is not. It is a reading taken at a setting, and the setting
              is a knob page 8 turned two pages ago.
            </p>
            <ReliabilitySweep />
            <p className="text-sm text-ink-muted">
              Temperature is where the candidates come from, and it is also what blinds the judge.
              Every judge here that is <strong className="text-ink">a model asked to judge</strong>{" "}
              decays as the pool gets noisier, one unexamined chain worst at{" "}
              {REL.steepest.fallPts.toFixed(0)} points. The only flat line is the one{" "}
              <strong className="text-ink">trained to score</strong>: it starts mid-pack and ends
              well clear, without having improved at all. Read it left to right, because the coldest
              column tells a different story. With an imperfect verifier more resampling eventually
              lowers true accuracy anyway, so a plateau is the best any of these buys.
              <Cite n={REF.stroebl} />
            </p>

            <div className="flex flex-col gap-2 border-t border-dashed border-grid pt-4">
              <p className="text-sm text-ink">
                And there is a second coordinate, quieter and worse: how much of the chain the
                grader can read at all.
              </p>
              <ReadableSliver />
              <p className="text-sm text-ink-muted">
                Page 9 graded {PAGE17.readable.stepsTotal.toLocaleString()} steps of real working
                twice, and an arithmetic checker can adjudicate{" "}
                {PAGE17.readable.stepsJudged.toLocaleString()} of them. The rest are prose:{" "}
                <em>by symmetry</em>, <em>consider the cases</em>. The reward model scores every
                step and is silent on none, but the numbers that make it trustworthy were measured
                against the checker, so they were measured inside the sliver. Page 9&apos;s run
                file says so: an optimistic estimate of its reliability on the prose steps it is
                trusted with.
              </p>
              <p className="text-sm text-ink-muted">
                Two prices for trusting it anyway. Filtering page 7&apos;s candidates by the
                soundness of their working moved a majority vote from{" "}
                {pct(PAGE17.readable.selection?.majority ?? 0)} to{" "}
                {pct(PAGE17.readable.selection?.filtered ?? 0)}, changing{" "}
                {PAGE17.readable.selection?.nChanged ?? 0} problem in {PAGE17.run.items}. And how
                much of a wrong chain counts as sound swings by the spread page 9 draws, on nothing
                but where the chain is cut into steps.
              </p>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Follow one judge left to right, then find the line that never moves.</p>
          </Note>
          <Note kicker="Where this comes from">
            <p>
              Both figures are the deck&apos;s own runs, drawn here for the first time: page
              8&apos;s judges re-read at every temperature it sampled, and page 9&apos;s step
              grading re-read as a question about the grader rather than about the chain.
            </p>
            <p>
              Reliability is undefined where no candidate is right, so its denominator shrinks
              with the temperature and this decline is the conservative reading. Candidate depth
              is held at {REL.depth} throughout, because reliability decays with that too.
            </p>
          </Note>
        </div>

        {/* Step 4 — what still works */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. What still works</h2>
          <p className="text-ink">
            <strong className="text-ink">Feedback from outside the model.</strong> Self-correction
            fails <em>unaided</em>; give the reviser real information, a failing unit test, a
            calculator, a proof checker, and revision has something to push against. Step 3 is why
            that is not a platitude: on {pct(PAGE17.readable.shareUnjudged, 0)} of the chain there
            is nothing to check against from inside.
          </p>
          <p className="text-ink">
            <strong className="text-ink">
              Verifiers, where answers are checkable, and trained ones by preference.
            </strong>{" "}
            Selection with a judge (page 8) still beats blind voting, up to the ceiling its
            reliability sets. Step 3 adds which judge: the trained scorer held across the whole
            sweep while every model asked to judge lost ground.
          </p>
          <p className="text-ink">
            <strong className="text-ink">Training, not prompting.</strong> The mid-chain
            &ldquo;wait, let me re-check&rdquo; that RL taught DeepSeek-R1 (page 14) was learned
            against verified rewards, not requested politely at inference time.
          </p>
          <div className="rounded-lg border-l-4 border-wrong bg-wrong/10 p-4 text-sm text-ink">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              And one caveat that reaches backwards
            </p>
            <p className="mt-2">
              <strong>Every accuracy number in this story was measured on problems the model may
              already have seen.</strong> A benchmark is published text, and published text is what
              the next model trains on, so a score can be reciting the test rather than reasoning
              through it. Here is the size of it: on AIME 2025, released after these models trained, reasoning
              models scored 7 to 30 points below their 1983 to 2024 averages, and a conventional
              model fell from 40% to 1%.
              <Cite n={REF.balachandran} /> That discounts the levers of Act 2 and the frontier
              scores of Act 3 alike; it does not tell you by how much, which is the uncomfortable
              part.
            </p>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.balachandran} href="https://arxiv.org/abs/2504.00294" preprint>
            Balachandran et al. 2025, <em>Inference-Time Scaling for Complex Tasks: Where We Stand
            and What Lies Ahead</em>.
          </RefItem>
        </Note>
      </div>

      {/* Handoff to 16. This used to hand off to a faithfulness page, cut on
          2026-08-10, and then briefly closed the deck. Page 16 now does the
          closing, so the assumption the cut page was going to attack is handed
          forward as the open question rather than delivered as a last word. */}
      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        Notice what every repair on this page assumed. The verifier reads the chain, the reviser
        reads the chain, and the reader reads the chain, and all three take it for what it says it
        is: the working that produced the answer.{" "}
        <em className="text-ink-muted">
          Hold that. Next: every lever in this story on one axis, twelve questions, and the two
          things the deck never settled.
        </em>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
