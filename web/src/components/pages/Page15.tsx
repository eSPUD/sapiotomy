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
 * THE SPINE OF THE PAGE IS ONE FAILURE WITH TWO TRIGGERS, and the section titles
 * carry it. Step 1 ("Fix your mistakes") is revision the reader asked for. Step 2
 * ("Thinking too hard") is revision the model performs unprompted, when a chain
 * left running overwrites an answer it had already reached. Nothing new enters in
 * either case. Step 3 ("Scoring gone wrong") is the verifier that could have caught
 * either one, and its claim, that reliability is a coordinate rather than a property,
 * is made in the copy rather than in the title so the four headings stay one register.
 * The titles also answer the page's own subtitle: without
 * them a reader cannot map self-correction, overthinking and verifier reliability
 * onto the sections that measure them.
 *
 * Steps 2 and 3 were an authored Markov chain and an authored inverse-U until
 * `page_17_when_reasoning_breaks.ipynb` re-read pages 5 to 9. Both are now the
 * deck's own runs (lib/page17.ts), and what replaced them is smaller than what
 * they claimed, which is the point of the page.
 *
 * Step 2 is page 6's budget sweep with the losses drawn back in. Its centre is
 * ONE problem: right when cut off and made to commit, wrong when allowed to
 * finish, and its mistake is an unjustified symmetry assumption a reader can
 * check. Three controls were run against it. Stopping early is not a strategy,
 * because a fixed cut is worse than finishing and the best cut buys no more
 * coverage per token than plain resampling: that one defends the READER'S
 * TAKEAWAY, so it stays in the body, and without it a reader leaves with a
 * technique that does not exist. The other two defend the specimen's reading
 * against a skeptic. They sat in the margin until 2026-08-10 and are now the
 * notebook's, under the rule that a margin note may only help a reader read the
 * figure beside it. The figure carries the first of them by itself: at the
 * middle cuts the bad assumption is already written and the forced commit
 * ignores it, which is that control drawn rather than asserted. The second (page
 * 5's zero-token blurt arm gets 6 of 16, so this is not the model already
 * knowing) is NOT drawn anywhere, and it is the one thing this page now asserts
 * that a reader cannot check on screen. `PAGE17.controls` still gates both, and
 * Page15.test.tsx still pins them false, so a rerun that flips one is a finding
 * rather than a green suite.
 *
 * The old step 3 asserted that easy problems cross an overthinking threshold
 * before hard ones. Pooled over three checkpoints our own run puts both medians
 * at the same budget, and the budget axis cannot carry the claim anyway: under
 * greedy decoding a chain that has stopped itself is not rerun at a larger
 * budget. The claim is deleted rather than softened; docs/page_17_findings.md
 * section 4 is why, and the loader keeps it reachable as a stated null.
 *
 * Step 3 is now the verifier, measured once. Reliability falls with the very
 * temperature that makes best-of-N worth running, and only the judge trained to
 * score stays flat, so the figure is a crossing and must be read left to right.
 *
 * It carried a second coordinate until 2026-08-10: the share of a chain we can
 * audit a grader against, drawn as a sliver. Three of its four claims were page
 * 9's own, restated, and the fourth (that the reward model's AUC, recall and
 * specificity were all taken inside that sliver) belonged beside the bar it
 * qualifies. The whole beat moved to page 9 beat 3 rather than being split, and
 * page 9's rule against quoting a flat AUC went with it, since the claim about
 * WHERE the numbers were taken is what gives a reader something to do with them.
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
import { useStore } from "@/store/useStore";

const PAGE_N = 15;

/** Page 15's references, numbered in order of first appearance. */
const REF = { huang: 1, zeng: 2, wang: 3, stroebl: 4 } as const;

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

/**
 * The axis floor. Every line lives between 38 and 77, so a 0 baseline spent a
 * third of the canvas on emptiness and squeezed five series into a band too
 * narrow to follow. 100 stays on the axis because "no judge here is anywhere
 * near perfect" is part of the claim; the floor is what gives way. Kept below
 * the lowest measured point so no line is ever clipped by it.
 */
const R_FLOOR = 0.25;
const ry = (r: number) => R_IH - ((r - R_FLOOR) / (1 - R_FLOOR)) * R_IH;

/** The two lines the reader is meant to follow: the flat one and the one that falls. */
const TRAINED = "best-of-N (skywork-prm)";
const NO_JUDGE = "one chain";
/** Both are a model asked to judge, and they land on the same point at the hot end. */
const MODEL_JUDGES = ["best-of-N (self)", "best-of-N (qwen7b)"];

/**
 * The wedge's lower edge: the best of everything that is not the trained scorer,
 * at each temperature, which is the fairest thing to charge the trained line
 * against. Module level so the figure's annotation and the paragraph beneath it
 * cannot quote different numbers for the same gap.
 */
const R_OTHERS = REL.lines.filter((l) => !l.trained);
const R_BEST_OTHER = REL.temperatures.map((t, i) =>
  Math.max(...R_OTHERS.map((o) => o.points[i].reliability)),
);
const R_HOT = REL.temperatures.length - 1;
const TRAINED_CLEAR_PTS =
  (REL.trained.points[R_HOT].reliability - R_BEST_OTHER[R_HOT]) * 100;

/**
 * Which line the trained scorer is actually being charged against at each column.
 * The reader who moves the dial is owed the name, not just the gap: "clear of what"
 * is half the claim, and on this run the answer happens to be the same selector at
 * every temperature, which is itself worth being able to see.
 */
const R_BEST_OTHER_LINE = REL.temperatures.map((t, i) =>
  R_OTHERS.reduce((a, b) => (b.points[i].reliability > a.points[i].reliability ? b : a)),
);

/** The trained scorer's lead over the best alternative, in points, at one column. */
const gapAt = (i: number) => (REL.trained.points[i].reliability - R_BEST_OTHER[i]) * 100;

/**
 * The sweep's coldest column is the one that makes the page's point, so it is where
 * the dial starts: there the trained scorer is BEHIND, and a reader who drags from
 * there watches a deficit turn into a lead without any judge getting better. If a
 * rerun ever removes that inversion, the crossing the figure is built around is gone
 * and the module says so rather than opening on a column that no longer surprises.
 */
const R_START = 0;
if (gapAt(R_START) >= 0) {
  throw new Error(
    "page 15's reliability dial opens on the column where the trained scorer trails, and on " +
      "this run it leads there, so the sweep no longer crosses",
  );
}

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
 * would otherwise have to do four times by eye. 100 stays on the axis because
 * "no judge here is anywhere near perfect" is also page 17's point; the floor
 * does not, because no line goes near it. Two lines carry the argument and are
 * the two drawn to be followed: the trained scorer, flat, and the unexamined
 * chain, falling furthest. The three in between are the field they move against.
 */
function ReliabilitySweep({ tempIndex }: { tempIndex: number }) {
  const trained = REL.trained;
  // Five labels at the right edge, three of them inside a few points of each
  // other, read as a rendering fault. The two model-as-judge lines finish on the
  // same value, so they get one label between them rather than two stacked on a
  // single point. If a rerun ever pulls them apart, they label themselves again.
  const endOf = (l: (typeof REL.lines)[number]) => l.points[l.points.length - 1].reliability;
  const judgeEnds = REL.lines.filter((l) => MODEL_JUDGES.includes(l.selector)).map(endOf);
  const mergeJudges =
    judgeEnds.length === MODEL_JUDGES.length &&
    Math.max(...judgeEnds) - Math.min(...judgeEnds) <= 0.02;

  const entries = REL.lines.flatMap((l) => {
    const tone = l.trained
      ? "fill-compute font-semibold"
      : l.selector === NO_JUDGE
        ? "fill-wrong font-semibold"
        : "fill-ink-muted";
    const leader = l.trained
      ? "stroke-compute"
      : l.selector === NO_JUDGE
        ? "stroke-wrong"
        : "stroke-grid";
    if (mergeJudges && MODEL_JUDGES.includes(l.selector)) {
      if (l.selector !== MODEL_JUDGES[0]) return [];
      return [
        {
          key: "model-judges",
          text: "two model judges",
          y: ry(judgeEnds.reduce((a, b) => a + b, 0) / judgeEnds.length),
          tone,
          leader,
        },
      ];
    }
    return [{ key: l.selector, text: l.label, y: ry(endOf(l)), tone, leader }];
  });
  const labelYs = dodge(entries.map((e) => e.y));

  return (
    <ChartFrame
      title={`Reliability of five ways of picking an answer, against sampling temperature, all measured over ${REL.depth} candidates. ${REL.lines
        .map(
          (l) =>
            `${l.label}: ${l.points.map((p) => `${pct(p.reliability)} at temperature ${p.temperature}`).join(", ")}`,
        )
        .join(". ")}. Every judge that is a model asked to judge decays; the trained reward model does not. The dial is on temperature ${REL.temperatures[tempIndex]}, where the trained reward model is ${Math.abs(gapAt(tempIndex)).toFixed(0)} points ${gapAt(tempIndex) >= 0 ? "clear of" : "behind"} ${R_BEST_OTHER_LINE[tempIndex].label}, the best of the rest.`}
      width={R_W}
      height={R_H}
      margin={R_M}
      xLabel="sampling temperature, the knob that buys candidate diversity"
      yLabel="reliability (%)"
    >
      {[0.25, 0.5, 0.75, 1].map((t) => (
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
          ...REL.temperatures.map((t, i) => `${rx(t)},${ry(R_BEST_OTHER[i])}`).reverse(),
        ].join(" ")}
      />

      {/* The wedge alone is a shape; this gives it a number, at the column the reader
          has the dial on. It is drawn after the wedge and before the lines so the
          measured points stay on top of their own measurement. */}
      {(() => {
        const gx = rx(REL.temperatures[tempIndex]);
        const yT = ry(trained.points[tempIndex].reliability);
        const yO = ry(R_BEST_OTHER[tempIndex]);
        const gap = gapAt(tempIndex);
        // Anchor the label away from the plot edge, or it clips at either end.
        const leftHalf = gx < R_IW / 2;
        return (
          <g>
            <line
              x1={gx}
              x2={gx}
              y1={0}
              y2={R_IH}
              className="stroke-ink-muted"
              strokeWidth={1}
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
            <line
              x1={gx}
              x2={gx}
              y1={yT}
              y2={yO}
              className={gap >= 0 ? "stroke-compute" : "stroke-wrong"}
              strokeWidth={3}
            />
            <text
              x={gx + (leftHalf ? 8 : -8)}
              y={(yT + yO) / 2 + 3}
              textAnchor={leftHalf ? "start" : "end"}
              className={`text-[10px] font-semibold ${gap >= 0 ? "fill-compute" : "fill-wrong"}`}
            >
              {gap >= 0
                ? `${gap.toFixed(0)} points clear`
                : `${Math.abs(gap).toFixed(0)} points behind`}
            </text>
          </g>
        );
      })()}

      {REL.temperatures.map((t, i) => (
        <text
          key={t}
          x={rx(t)}
          y={R_IH + 16}
          textAnchor="middle"
          className={
            i === tempIndex ? "fill-ink text-[11px] font-semibold" : "fill-ink-muted text-[11px]"
          }
        >
          {t.toFixed(1)}
        </text>
      ))}

      {REL.lines.map((line) => {
        const falls = line.selector === NO_JUDGE;
        const stroke = line.trained ? "stroke-compute" : falls ? "stroke-wrong" : "stroke-ink-muted";
        const fill = line.trained ? "fill-compute" : falls ? "fill-wrong" : "fill-ink-muted";
        return (
          <g key={line.selector}>
            <polyline
              fill="none"
              className={stroke}
              strokeWidth={line.trained || falls ? 2.5 : 1.25}
              strokeOpacity={line.trained || falls ? 1 : 0.6}
              points={line.points.map((p) => `${rx(p.temperature)},${ry(p.reliability)}`).join(" ")}
            />
            {line.points.map((p, i) => {
              // The two the dial is comparing get a ring at the selected column, so
              // the gap bar is visibly drawn between two measured points and not
              // between a point and an abstraction.
              const charged =
                i === tempIndex &&
                (line.trained || line.selector === R_BEST_OTHER_LINE[tempIndex].selector);
              return (
                <circle
                  key={p.temperature}
                  cx={rx(p.temperature)}
                  cy={ry(p.reliability)}
                  r={charged ? 5 : line.trained || falls ? 3.5 : 2}
                  className={fill}
                  stroke={charged ? "currentColor" : undefined}
                  strokeWidth={charged ? 1.5 : undefined}
                  strokeOpacity={charged ? 1 : undefined}
                />
              );
            })}
          </g>
        );
      })}

      {entries.map((e, i) => (
        <g key={`label-${e.key}`}>
          <line
            x1={R_IW}
            x2={R_IW + 8}
            y1={e.y}
            y2={labelYs[i]}
            className={e.leader}
            strokeWidth={1}
          />
          <text x={R_IW + 12} y={labelYs[i] + 3} className={`text-[10px] ${e.tone}`}>
            {e.text}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const huang = curves.selfCorrection;
  const h = huang.fit!.params;

  const [budgetIndex, setBudgetIndex] = useState(0);
  const [tempIndex, setTempIndex] = useState(R_START);

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
            1. Fix your mistakes
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              verbatim published numbers
            </span>
          </h2>
          <p className="text-ink-muted">
            You have almost certainly tried this yourself: you ask a model a question, the answer
            comes back wrong, so you send it straight back with &ldquo;check that again and fix any
            mistakes.&rdquo; No hints, no tools, just re-reading. Measured across two rounds of
            exactly that, accuracy goes <strong className="text-ink">down</strong>.
          </p>
          <section
            aria-label="Two rounds of unaided self-correction, on two published benchmarks"
            className="flex flex-col gap-3 rounded-lg border border-grid bg-surface p-4"
          >
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
          </section>
          <p className="text-ink-muted">
            The reason is structural: the same weights that produced the error are asked to find it,
            so the review mostly re-approves the answer, and when the model does change something,
            it flips correct answers to wrong <em>more often than the reverse</em>.
            <Cite n={REF.huang} /> Nothing new enters the system; &ldquo;are you sure?&rdquo; just
            adds noise, and on CommonSenseQA one round of it cost GPT-3.5 half its score.
          </p>
        </section>

        <Note kicker="References">
          <RefItem n={REF.huang} href="https://arxiv.org/abs/2310.01798">
            Huang et al. 2024, <em>Large Language Models Cannot Self-Correct Reasoning Yet</em>{" "}
            (ICLR 2024), Table 3. &ldquo;Round&rdquo; = the model is shown its own answer and asked
            to review and revise it, with no external feedback.
          </RefItem>
        </Note>

        {/* Step 2 — thinking too hard: page 6's curve with the losses drawn back in */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Thinking too hard
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              our run · {PAGE17.run.items} problems · {PAGE17.run.primaryLabel} · greedy
            </span>
          </h2>
          <p className="text-ink-muted">
            Step 1 was a revision <strong className="text-ink">you asked for</strong>. This one the
            model performs on its own: left running, a chain keeps writing, and what it writes can
            replace an answer it had already reached. Raise the token cap and page 6&apos;s accuracy
            curve climbs, though most of the climb is chains that were being cut off mid-thought
            finally reaching an end. But a rising curve only shows the{" "}
            <strong className="text-ink">balance</strong> of two things happening at once. Below,
            the same run with them separated: the answers each doubling of the budget wins, and the
            answers it costs.
          </p>
          <section
            aria-label="Answers won and lost at each doubling of the token budget"
            className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
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
          </section>
          <p className="text-ink-muted">
            Every rung loses answers as well as gaining them, and those losses were never drawn
            until now. The top rung gains <strong className="text-ink">nothing</strong>, for a
            reason that is about the axis rather than about thinking.
          </p>

          {/* The invitation is the last line of the intro, directly above the figure it invites
              the reader into, as on pages 5 and 7. */}
          <p className="text-ink-muted">
            So look at one of the losses. The budget above still drives what follows. Watch a single
            problem: <span className="font-mono text-xs text-ink">{PAGE17.specimen.shortId}</span>,
            minimise <em>(x+y)(y+z)</em> given <em>xyz(x+y+z) = 1</em>. The answer is{" "}
            {PAGE17.specimen.groundTruth}.
          </p>
          <section
            aria-label="One chain at the chosen budget, from a forced commit to its own ending"
            className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
            <SpecimenChain budgetIndex={budgetIndex} />
          </section>
          <p className="text-ink-muted">
            Cut at {PAGE17.specimen.rightWhenCutAt.join(", ")} tokens and forced to commit, it
            answers {PAGE17.specimen.groundTruth} three times over. Allowed to run to its own{" "}
            {PAGE17.specimen.naturalLength}-token ending, it answers{" "}
            <span className="font-mono text-xs">{tidyMath(PAGE17.specimen.wrongAnswer ?? "")}</span>.
            The step that costs it is lit, and every line after it is correct arithmetic carrying a
            wrong assumption to a confident finish. It breaks on{" "}
            {PAGE17.specimen.alsoRegressesOn.join(" and ")} too.
          </p>

          {/* Control 3 stays in the body because without it a reader leaves with a technique
              that does not exist. Controls 1 and 2 defend the specimen's reading rather than
              the reader's takeaway, so they sit in the margin. */}
          <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              what this is not
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
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>Drag to {PAGE17.axisBound.maxBudget} and read what it commits to.</p>
          </Note>
          <Note kicker="Why the top rung is empty">
            <p>
              Under greedy decoding a chain that has already stopped itself is not run again at a
              larger budget, it is the same generation, and{" "}
              {pct(PAGE17.axisBound.shareSelfTerminated, 0)} of these end themselves before{" "}
              {PAGE17.axisBound.maxBudget} tokens. The axis runs out before the model does.
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

        {/* Step 3 — scoring gone wrong: reliability is a coordinate, not a property */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Scoring gone wrong
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              our run · the same {PAGE17.run.items} problems · page 8&apos;s judges
            </span>
          </h2>
          <p className="text-ink-muted">
            Step 2 leaned on a judge, and page 8 sold one: selection beats voting, up to the ceiling
            its reliability sets. That sentence quotes reliability as though it were a property of
            the judge. It is not. It is a reading taken at a setting, and the setting is a knob page
            8 turned two pages ago.
          </p>
          <section
            aria-label="Reliability of five ways of picking an answer, against sampling temperature"
            className="flex flex-col gap-3 rounded-lg border-l-4 border-compute bg-surface p-4"
          >
            <Slider
              label="Sampling temperature"
              min={0}
              max={REL.temperatures.length - 1}
              value={tempIndex}
              format={(i) => REL.temperatures[i].toFixed(2)}
              ticks={REL.temperatures.map((t, i) => i)}
              onChange={(v) => {
                setTempIndex(v);
                recordInteraction(PAGE_N);
              }}
            />
            <ReliabilitySweep tempIndex={tempIndex} />
            <p className="text-sm text-ink-muted">
              At <strong className="text-ink">{REL.temperatures[tempIndex].toFixed(2)}</strong>, the
              trained scorer is{" "}
              <strong className={gapAt(tempIndex) >= 0 ? "text-ink" : "text-wrong"}>
                {Math.abs(gapAt(tempIndex)).toFixed(0)} points{" "}
                {gapAt(tempIndex) >= 0 ? "clear of" : "behind"}
              </strong>{" "}
              {R_BEST_OTHER_LINE[tempIndex].label}, the best of everything else at this setting.{" "}
              {gapAt(tempIndex) < 0
                ? "Start here and the trained scorer looks like the wrong pick. Turn the dial up."
                : null}
            </p>
            <p className="text-xs text-ink-muted">
              The dial moves between the four settings this run measured. It does not interpolate,
              because nothing was measured between them.
            </p>
          </section>
          <p className="text-ink-muted">
            Temperature buys the candidate diversity page 8 was selling, and the same knob blinds
            whatever has to sort the candidates. Sort them with nothing and reliability falls{" "}
            {REL.steepest.fallPts.toFixed(0)} points across the sweep. Sort them with{" "}
            <strong className="text-ink">a model asked to judge</strong> and it still falls.
          </p>
          <p className="text-ink-muted">
            Only the line <strong className="text-ink">trained to score</strong> holds, and not by
            judging better: it sits mid-pack at the cold end and never improves. It finishes{" "}
            {TRAINED_CLEAR_PTS.toFixed(0)} points clear because everything else came down to meet
            it. What this sweep measures is the verifier, not the reasoning, and with an imperfect
            one more resampling eventually lowers true accuracy outright.
            <Cite n={REF.stroebl} />
          </p>
          {/* Two limits on the figure. A limit is a caption, not a margin note, so they
              sit in the body under the sweep they qualify rather than beside it. */}
          <p className="text-sm text-ink-muted">
            Candidate depth is held at {REL.depth} throughout, because reliability decays with that
            too. And reliability is undefined where no candidate is right, so the denominator
            shrinks as the temperature rises, which makes this decline the conservative reading.
          </p>
        </section>

        <div className="flex flex-col gap-6">
          <Note kicker="Try it">
            <p>
              Turn the temperature up and watch the trained scorer go from behind to clear without
              ever getting better.
            </p>
          </Note>
        </div>

        {/* Step 4 — what still works */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. What still works</h2>
          <p className="text-ink">
            <strong className="text-ink">Feedback from outside the model.</strong> Self-correction
            fails <em>unaided</em>; give the reviser real information, a failing unit test, a
            calculator, a proof checker, and revision has something to push against. Page 9 is why
            that is not a platitude: {PAGE17.readable.nChainsUnreadable.toLocaleString()} of{" "}
            {PAGE17.readable.nChains.toLocaleString()} real chains (
            {pct(PAGE17.readable.shareChainsUnreadable, 0)}) carry no closed-form numeric claim
            anywhere, so a calculator never fires at all on two chains in three.
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
        </section>
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
