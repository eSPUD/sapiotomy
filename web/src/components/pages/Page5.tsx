"use client";

/**
 * Page 5, "Chain of Thought: Reasoning Out Loud" — Act 2 opens on page 4's
 * question: can a machine be walked down a road? In 2026 the answer arrives
 * before the question does. A plain instruct model reasons on a hard maths
 * problem with nothing in the prompt asking it to, so the page cannot be about
 * summoning a chain. It is about what the chain is worth, measured the only way
 * left: by taking it away.
 *
 * EVERY NUMBER ON THIS PAGE IS OURS AND IS MEASURED, with one labelled
 * exception: section 4's training-cost comparison (2026-09-27) is an estimate
 * from standard formulas, said so in its margin note and sourced there (see
 * COST_ESTIMATE). Nothing is redrawn from a paper and nothing is authored. The source is one run of
 * `notebooks/page_05_how_to_reason.ipynb` — Qwen2.5-Instruct at bf16 (1.5B, 3B,
 * 7B; the 3B is the primary), MATH-500 levels 4 and 5, 100 paired items, greedy,
 * 900 generations. Its `derived.json` is committed verbatim to
 * `web/data/page-05-derived.json` and loaded through `@/lib/page05`, which reads
 * the run's `claims` gates BEFORE any number and throws if one is false. No
 * inference runs at demonstration time; the page replays committed logs.
 *
 * Layout: page 6's shell. One reading column of numbered steps, each beside its
 * own margin note that scrolls with it. Every step that carries a figure opens
 * with a sentence saying what the figure is a picture OF, because the numbers
 * are meaningless without their denominator: "43" is not a claim, "43 of the
 * same 100 problems" is.
 *
 *   Step 1 — the definition and figure 1, the specimen, merged 2026-09-27 under
 *   planning/reviewer_response_changes_plan.md (page 5, sections 1 and 2). The
 *   two paragraphs are the author's (rewritten 2026-09-27): chain-of-thought
 *   prompting as each step feeding the next, then the classic ask. The 17 × 24
 *   worked example went with that rewrite. No
 *   "for a model the steps ARE the thinking" contrast: the author cut it
 *   2026-09-27, since a person's written steps are their thinking too, so there
 *   is no difference to claim. It ends on the classic way to ASK,
 *   quoting Kojima's trigger ("Let's think step by step.") because the marker
 *   sits on that phrase; the run's own `zero_shot_cot` suffix is a different
 *   string and its arm is not on the page. The second paragraph says today's
 *   models no longer need that prompt, since System 2 is their default, and hands
 *   the reader the split: the 3B forced into System 1 beside its default.
 *
 *   The token and greedy glosses moved to the glossary, page 17, on
 *   2026-09-27; only the references sit in the margin beside this step. One problem,
 *   one model, one decoding setting, two prompts that differ only by a suffix.
 *   Since 2026-09-27 the figure is a split of two chats set like page 2's (user
 *   and model icons, no bubbles), System 1 beside System 2, with no mode buttons.
 *   Each shows the question alone; the suffix is not on the page. Play shows
 *   both whole replies at once, grouped into intermediate steps, and Reset
 *   clears them. Question and trace are set in `font-code`: they are listings
 *   of what a machine read and wrote. The
 *   instruction condition is NOT a third tab: it is measured, and it lives in the
 *   notebook download (see the load-bearing list below).
 *
 *   Step 2 — figure 2, the page's headline: the McNemar 2x2 as two stacked
 *   bars of the same 100 problems, one per system: solved by both, solved only
 *   by that system, not solved. It replaced a 2x2 matrix, and before that a
 *   100-square grid with a
 *   System 1 / System 2 switch on 2026-09-27 (author): the grid was grouped by
 *   outcome, and readers took its first squares for the first problems. The
 *   four counts are fully determined by the two discordant counts and the two
 *   solve counts the notebook reports. We do not ship per-item outcomes to the
 *   page, so no row may name a problem.
 *
 *   Step 3 — figure 3, three checkpoints. The claim is the FLAT FLOOR, never
 *   scale: three points are not a scaling law, our trend has no sign flip, and
 *   emergence is page 11's subject. No size axis, no line through the points,
 *   and no caption that can be read as either. Section 1 of the spec.
 *
 *   Step 4 — figure 4, "The cost of a chain of thought" (reframed around tokens
 *   2026-09-27: System 2 writes about a hundred times the tokens of System 1,
 *   yet a million chains cost about a hundred-thousandth of training). Before: This used to be three
 *   stat cards, one of which was a "trade": 95.5x the tokens for 36 points. Two
 *   things were wrong with it. It never said which of the three checkpoints it
 *   was quoting (the 3B, and a reader had no way to know), and putting a ratio
 *   on a card asserts a rate of exchange the run cannot price, because the two
 *   prompts differ by more than the length of what they produce. The cards are
 *   now one pair of axes: median tokens written across, share of the same 100
 *   solved up, six dots for three checkpoints under two prompts. The dots are
 *   deliberately unjoined and the caption says why. What the figure shows is the
 *   thing the cards hid: the tokens move with the PROMPT, in two clusters two
 *   decades apart, while the accuracy moves with the MODEL, up the page inside
 *   each cluster.
 *
 * The apparatus lives in the margin, one note per step, not in a footer. The
 * three-paragraph footnote this page used to end on was doing the notebook's
 * job: a reader who wants the full method downloads the run. What survives in
 * the margin is only what a reader needs while looking at THAT figure. The
 * instruction null and the exemplar rungs went back to the notebook on
 * 2026-08-08: the page shows what the chain is worth, and a note on how a model
 * that already reasons responds to being asked to was prompt engineering the
 * reader had no use for.
 *
 * The notes have been cut twice and the rule that survived both is: a note may
 * say what a reader cannot work out from the figure beside it, and nothing else.
 * The grading provenance went back to the notebook under that rule even though
 * it is true and load-bearing, because a reader looking at 100 squares does not
 * need to know whose `grade_answer` drew them. Anything that reads as method
 * belongs in the download.
 *
 * Load-bearing and easy to lose:
 *   · the notebook download is the whole point of the pipeline. The link carries
 *     the notebook, `harness.py` and all 900 traces, so a reader who doubts a
 *     figure re-derives it. It sits at the top right of the page, beside the act
 *     kicker; the references sit in right-hand References sidenotes beside the
 *     steps that cite them (Wei, Kojima and the model card beside step 1, the
 *     dataset beside step 2, Kaplan and the Qwen2.5 report beside step 4's
 *     estimate). The run's ledger sits INSIDE step 4's figure card,
 *     where it has the card's width: the margin column wrapped it mid-hash.
 *   · the conditions are named plainly, "reasoning" and "non-reasoning", on
 *     every surface: buttons, cluster labels, aria titles, prose. No euphemism
 *     ("left alone", "forbidden to reason") may come back.
 *   · the instruction null and the exemplar rungs are measured, in the run, and
 *     deliberately NOT on the page (removed 2026-08-08; the claims gate
 *     `instruction_null_bounded` still gates the data load). If they return,
 *     the bound rule returns with them: a BOUND, never a zero, never the word
 *     "nothing" unqualified.
 *   · chain share is a blurt detector and nothing more. It verifies the gag
 *     worked; it is not a measure of how much reasoning happened.
 *   · figure 4's dots stay unjoined, and no sentence on the page may say the
 *     tokens bought the points. Tokens are a cost the page reports, never a
 *     price it quotes: the only thing that moved between the clusters is the
 *     prompt, and page 6 is where length itself becomes the variable.
 *   · Wei et al. and Kojima et al. are cited for the TECHNIQUES they introduced.
 *     No cite may carry one of our numbers or sit where it implies the data came
 *     from a paper.
 */

import { useState } from "react";
import { Handoff } from "@/components/Handoff";
import { ChartFrame } from "@/components/ChartFrame";
import { ModelIcon, UserIcon } from "@/components/ChatIcons";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { NotebookDownload } from "@/components/NotebookDownload";
import { ACTS, getPage } from "@/lib/pages";
import {
  PAGE5,
  SUPPRESSION_TABLE,
  pct,
  reasoningSteps,
  tidyMath,
  type SpecimenTab,
} from "@/lib/page05";
import { useStore } from "@/store/useStore";

const PAGE_N = 5;

const F1 = PAGE5.figure1;
const F2 = PAGE5.figure2;
const F3 = PAGE5.figure3;
/** Figure 1's two sides: the forced blurt (System 1) and the bare prompt (System 2). */
const BLURT_TAB = F1.tabs.find((t) => t.condition === "forced_blurt")!;
const BARE_TAB = F1.tabs.find((t) => t.condition === "bare")!;
const CLOSE = PAGE5.close;
const M = PAGE5.manifest;
/** The checkpoint every figure above the close is measured on. */
const PRIMARY_ROW = F3.models.find((m) => m.modelId === PAGE5.figure2.modelId)!;
/** Section 4's intro: "around 570" and "5 or 6", read off the run. */
const BARE_MEDIAN_ROUNDED =
  Math.round(F3.models.reduce((a, m) => a + m.bareMedianTokens, 0) / F3.models.length / 10) * 10;
const BLURT_MIN = Math.min(...F3.models.map((m) => m.blurtMedianTokens));
const BLURT_MAX = Math.max(...F3.models.map((m) => m.blurtMedianTokens));
const BLURT_MEDIAN_RANGE = BLURT_MIN === BLURT_MAX ? `${BLURT_MIN}` : `${BLURT_MIN} or ${BLURT_MAX}`;

/** The download: notebook + harness + every generation the page rests on. */
const NOTEBOOK_ZIP = "/notebooks/page-05-how-to-reason.zip";
const NOTEBOOK_SIZE = "0.8 MB";

/**
 * Numbered in order of first appearance. Wei and Kojima are cited for the
 * techniques they introduced; the model card and the dataset are cited as the
 * instruments the run was made with. Every number on this page is ours, so no
 * entry may carry a figure.
 */
const REF = { wei: 1, kojima: 2, qwen: 3, math500: 4, kaplan: 5, qwenReport: 6 } as const;

/**
 * Section 4's cost comparison, 2026-09-27. These are ESTIMATES, the one
 * exception to "every number on this page is measured", and the margin note
 * beside section 4 says so. Standard approximations (Kaplan et al. 2020): about
 * 2 operations per parameter per token written, and 6 per parameter per token
 * trained on. The Qwen2.5 report gives the family's pretraining set as 18
 * trillion tokens; whether every size saw all of it is not stated, so the
 * training figure is an upper-end estimate. Page5.test.tsx checks that the
 * words in the prose ("about a hundred-thousandth") still match this maths.
 */
const PRETRAIN_TOKENS = 18e12;
export const COST_ESTIMATE = (() => {
  const params = PRIMARY_ROW.params;
  /** Operations for the primary model to write one median chain of thought. */
  const chainFlops = 2 * params * PRIMARY_ROW.bareMedianTokens;
  /** Operations to train it. */
  const trainFlops = 6 * params * PRETRAIN_TOKENS;
  return { chainFlops, trainFlops, millionChainsShare: (1e6 * chainFlops) / trainFlops };
})();

/**
 * The trigger Kojima et al. published, quoted as they published it, because the
 * marker beside it sends the reader to that paper. The run's own instruction
 * suffix is a different string and is not on the page.
 */
const ZERO_SHOT_COT_TRIGGER = "Let's think step by step.";

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold font-eyebrow uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

const chip = "rounded-full border border-grid px-2 py-0.5 text-ink-muted";

/* ------------------------------------------------------------------ figure 1 */

/**
 * One side of figure 1's split: a chat set like page 2's, the user's turn on the
 * right and the model's on the left, each marked by an icon, as plain monospace
 * with no bubbles. Both sides show the question alone. Each reveal is one
 * intermediate step (an instruction with the working it announces), not one
 * line. Play shows both replies whole, at once; there is no streaming.
 */
function ChatColumn({
  title,
  tab,
  shown,
}: {
  title: string;
  tab: SpecimenTab;
  shown: boolean;
}) {
  const steps = reasoningSteps(tab.steps);
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-3">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="flex flex-1 flex-col gap-5 rounded-lg border border-grid bg-canvas p-3">
        <div className="flex max-w-[95%] items-start gap-2 self-end">
          <p data-testid="user-question" className="text-right font-code text-sm text-ink">
            {tidyMath(F1.question)}
          </p>
          <UserIcon />
        </div>

        <div className="flex max-w-[95%] items-start gap-2 self-start">
          <ModelIcon />
          <div data-testid="model-reply" className="flex min-w-0 flex-col gap-2">
            {!shown ? (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <span aria-hidden="true" className="animate-pulse text-compute-ink">
                  ▍
                </span>
                press Play to see its reply
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {steps.map((s, i) => (
                  <li key={i} className="flex gap-2 font-code text-sm leading-relaxed text-ink">
                    {steps.length > 1 ? <span className="shrink-0 text-compute-ink">{i + 1}</span> : null}
                    <span className="flex min-w-0 flex-col gap-1">
                      {s.parts.map((part, j) => (
                        <span key={j} className="whitespace-pre-wrap break-words">
                          {tidyMath(part)}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {shown ? (
              <p
                className={`rounded border-l-4 px-3 py-2 ${
                  tab.correct ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                }`}
              >
                <span className={`font-semibold ${tab.correct ? "text-correct-ink" : "text-wrong-ink"}`}>
                  {tab.correct ? "✓" : "✗"} Final answer: {tab.extractedAnswer}.
                </span>{" "}
                <span className="font-mono text-xs tabular-nums text-ink-muted">
                  {tab.tokensGenerated} tokens · {steps.length} {steps.length === 1 ? "step" : "steps"}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ figure 2 */

/**
 * Figure 2's bars: the notebook's paired table as two stacked bars of the same
 * 100 problems. The gag is the baseline and the chain is the change, so
 * `beforeOnly` is solved only in System 1 and `afterOnly` only in System 2.
 * Getting that backwards swaps 4 and 40, so Page5.test.tsx checks each bar's
 * solved segments against its solve count.
 */
const SOLVED_BARS = [
  {
    label: "System 1",
    solved: PAGE5.figure2.blurt.nCorrect,
    segments: [
      { key: "both", count: SUPPRESSION_TABLE.both },
      { key: "only", count: SUPPRESSION_TABLE.beforeOnly },
      { key: "unsolved", count: SUPPRESSION_TABLE.n - PAGE5.figure2.blurt.nCorrect },
    ],
  },
  {
    label: "System 2",
    solved: PAGE5.figure2.bare.nCorrect,
    segments: [
      { key: "both", count: SUPPRESSION_TABLE.both },
      { key: "only", count: SUPPRESSION_TABLE.afterOnly },
      { key: "unsolved", count: SUPPRESSION_TABLE.n - PAGE5.figure2.bare.nCorrect },
    ],
  },
] as const;

/**
 * Two steps of the cyan size ramp for the two kinds of solved (validated as an
 * ordinal pair, and both carry paper text at AA), and the neutral grid for not
 * solved, which reads as absence rather than as a third category.
 */
const SEGMENT_STYLE = {
  both: { fill: "fill-size-4", text: "fill-canvas", name: "solved by both" },
  only: { fill: "fill-size-3", text: "fill-canvas", name: "solved only by this system" },
  unsolved: { fill: "fill-grid", text: "fill-ink", name: "not solved" },
} as const;

const SOLVED_W = 660;
const SOLVED_H = 150;
const SOLVED_MARGIN = { top: 12, right: 84, bottom: 40, left: 74 };
const SOLVED_INNER_W = SOLVED_W - SOLVED_MARGIN.left - SOLVED_MARGIN.right;
const SOLVED_INNER_H = SOLVED_H - SOLVED_MARGIN.top - SOLVED_MARGIN.bottom;
/**
 * Every segment carries its count, the thin "3" and "4" included (author,
 * 2026-09-27). At text-xs a digit is about 7px, and the 3 is about 13px wide
 * after its gap, so a single digit fits; the check only guards a future run
 * whose counts outgrow their segment.
 */
const segmentFits = (count: number, w: number) => w >= String(count).length * 7 + 2;

function SolvedChart() {
  const n = SUPPRESSION_TABLE.n;
  const x = (v: number) => (v / n) * SOLVED_INNER_W;
  const rowH = SOLVED_INNER_H / SOLVED_BARS.length;
  const barH = 28;
  return (
    <ChartFrame
      title={`The same ${n} problems, stacked for each system. System 1 solves ${SOLVED_BARS[0].solved}: ${SUPPRESSION_TABLE.both} solved by both and ${SUPPRESSION_TABLE.beforeOnly} only by System 1. System 2 solves ${SOLVED_BARS[1].solved}: the same ${SUPPRESSION_TABLE.both} and ${SUPPRESSION_TABLE.afterOnly} only by System 2.`}
      width={SOLVED_W}
      height={SOLVED_H}
      margin={SOLVED_MARGIN}
      xLabel={`problems, of the same ${n}`}
    >
      {[0, 25, 50, 75, 100].map((t) => (
        <text key={t} x={x(t)} y={SOLVED_INNER_H + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
          {t}
        </text>
      ))}
      {SOLVED_BARS.map((bar, i) => {
        const y = i * rowH + rowH / 2 - barH / 2;
        let start = 0;
        return (
          <g key={bar.label}>
            <text x={-10} y={y + barH / 2 + 4} textAnchor="end" className="fill-ink text-sm font-semibold">
              {bar.label}
            </text>
            {bar.segments.map((seg) => {
              const x0 = x(start);
              start += seg.count;
              // A 2px paper gap between segments, taken from the segment's own width.
              const w = Math.max(0, x(seg.count) - (start < n ? 2 : 0));
              const style = SEGMENT_STYLE[seg.key];
              return (
                <g key={seg.key} data-testid={`bar-${bar.label}-${seg.key}`}>
                  <rect x={x0} y={y} width={w} height={barH} className={style.fill}>
                    <title>{`${bar.label}: ${seg.count} ${style.name}`}</title>
                  </rect>
                  {segmentFits(seg.count, w) ? (
                    <text
                      x={x0 + w / 2}
                      y={y + barH / 2 + 4}
                      textAnchor="middle"
                      className={`${style.text} pointer-events-none text-xs font-semibold tabular-nums`}
                    >
                      {seg.count}
                    </text>
                  ) : null}
                </g>
              );
            })}
            <text x={SOLVED_INNER_W + 8} y={y + barH / 2 + 4} className="fill-ink text-xs tabular-nums">
              {bar.solved} solved
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ figure 3 */

const FLOOR_W = 660;
const FLOOR_H = 250;
const FLOOR_MARGIN = { top: 30, right: 30, bottom: 44, left: 122 };
const FLOOR_INNER_W = FLOOR_W - FLOOR_MARGIN.left - FLOOR_MARGIN.right;
const FLOOR_INNER_H = FLOOR_H - FLOOR_MARGIN.top - FLOOR_MARGIN.bottom;

/**
 * Three checkpoints, each bar split at the accuracy it keeps non-reasoning.
 * The shaded band is the claim: gagged, every model lands
 * in the same narrow strip, and the strip does not move with size. There is no
 * size axis and no line through the points, deliberately.
 */
function FloorChart() {
  const rows = F3.models;
  const maxBlurt = Math.max(...rows.map((m) => m.blurtAccuracy));
  const x = (v: number) => (v / 100) * FLOOR_INNER_W;
  const rowH = FLOOR_INNER_H / rows.length;
  const barH = 22;
  const crossX = x(F3.cross.ungagged_small_accuracy * 100);

  return (
    <ChartFrame
      title={`Share of 100 MATH-500 problems solved by three Qwen2.5-Instruct checkpoints, each bar split into the part it keeps non-reasoning and the part its reasoning adds. Non-reasoning: ${rows.map((m) => `${m.label} ${pct(m.blurtAccuracy)}`).join(", ")}. Reasoning: ${rows.map((m) => `${m.label} ${pct(m.bareAccuracy)}`).join(", ")}.`}
      width={FLOOR_W}
      height={FLOOR_H}
      margin={FLOOR_MARGIN}
      xLabel="percentage of problems solved"
    >
      {/* the floor: every gagged bar ends inside this strip */}
      <rect x={0} y={0} width={x(maxBlurt * 100)} height={FLOOR_INNER_H} className="fill-wrong opacity-10" />
      <line
        x1={x(maxBlurt * 100)}
        x2={x(maxBlurt * 100)}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-wrong"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <text x={x(maxBlurt * 100) + 6} y={-10} className="fill-wrong-ink text-[11px] font-semibold">
        the floor: non-reasoning, all three land in here
      </text>

      {/* gridlines */}
      {[0, 25, 50, 75, 100].map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={FLOOR_INNER_H} className="stroke-grid" strokeWidth={1} />
          <text x={x(t)} y={FLOOR_INNER_H + 16} textAnchor="middle" className="fill-ink-muted text-[11px]">
            {t}
          </text>
        </g>
      ))}

      {/* the cross-model comparison, as a guide the eye can land on */}
      <line
        x1={crossX}
        x2={crossX}
        y1={0}
        y2={FLOOR_INNER_H}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="4 4"
      />

      {rows.map((m, i) => {
        const y = i * rowH + rowH / 2 - barH / 2;
        const kept = x(m.blurtAccuracy * 100);
        const added = x(m.bareAccuracy * 100) - kept;
        return (
          <g key={m.modelId}>
            <text x={-10} y={y + barH / 2 + 4} textAnchor="end" className="fill-ink text-xs">
              {m.label.replace("Qwen2.5-", "").replace("-Instruct", "")}
            </text>
            <text x={-10} y={y + barH / 2 + 17} textAnchor="end" className="fill-ink-muted text-[10px]">
              {m.quant}
            </text>
            <rect x={0} y={y} width={kept} height={barH} className="fill-wrong" />
            <rect x={kept} y={y} width={added} height={barH} className="fill-compute" />
            <text x={kept + added + 8} y={y + barH / 2 + 4} className="fill-ink text-xs tabular-nums">
              {pct(m.bareAccuracy)}
            </text>
            <text
              x={kept + added / 2}
              y={y + barH / 2 + 4}
              textAnchor="middle"
              className="fill-ink text-[11px] font-semibold tabular-nums"
            >
              +{m.deltaPts}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ close */

const COST_W = 700;
const COST_H = 340;
const COST_MARGIN = { top: 16, right: 92, bottom: 50, left: 54 };
const COST_INNER_W = COST_W - COST_MARGIN.left - COST_MARGIN.right;
const COST_INNER_H = COST_H - COST_MARGIN.top - COST_MARGIN.bottom;
/** Three decades, because 6 tokens and 573 share no linear axis worth reading. */
const COST_DECADES = 3;
/** Percent at the top of the accuracy axis: the reasoning 7B reaches 60. */
const COST_Y_MAX = 70;
/** The log axis's minor ticks: 2 to 9 times each decade, 2 to 900. */
const COST_X_MINOR = Array.from({ length: COST_DECADES }, (_, d) =>
  [2, 3, 4, 5, 6, 7, 8, 9].map((m) => m * 10 ** d),
).flat();
/** A gridline every 10 points, the top of the axis included (author, 2026-09-27). */
const COST_Y_TICKS = Array.from({ length: COST_Y_MAX / 10 + 1 }, (_, i) => i * 10);

/**
 * Model size is encoded by marker SHAPE, one per model in size order, with a
 * legend (author, 2026-09-27; an area-scaled dot was tried first and replaced).
 * Colour stays on the prompt, so the two encodings never compete.
 */
type MarkerShape = "circle" | "square" | "triangle";
const MARKER_SHAPES: readonly MarkerShape[] = ["circle", "square", "triangle"];
const shapeOf = (modelId: string): MarkerShape =>
  MARKER_SHAPES[F3.models.findIndex((m) => m.modelId === modelId)];

/** One marker, centred on (cx, cy), about 11px across whatever its shape. */
function Marker({
  shape,
  cx,
  cy,
  className,
  strokeWidth,
}: {
  shape: MarkerShape;
  cx: number;
  cy: number;
  className: string;
  strokeWidth: number;
}) {
  if (shape === "square") {
    return (
      <rect
        data-shape={shape}
        x={cx - 4.5}
        y={cy - 4.5}
        width={9}
        height={9}
        className={className}
        strokeWidth={strokeWidth}
      />
    );
  }
  if (shape === "triangle") {
    return (
      <path
        data-shape={shape}
        d={`M ${cx} ${cy - 6} L ${cx + 5.5} ${cy + 4} L ${cx - 5.5} ${cy + 4} Z`}
        className={className}
        strokeWidth={strokeWidth}
      />
    );
  }
  return <circle data-shape={shape} cx={cx} cy={cy} r={5} className={className} strokeWidth={strokeWidth} />;
}

/** Short enough to sit beside a dot: "Qwen2.5-1.5B-Instruct" is not. */
const sizeLabel = (params: number) => `${Number((params / 1e9).toFixed(1))}B`;

/**
 * The close, as one pair of axes: across, the median tokens a checkpoint wrote
 * per problem; up, the share of the same 100 problems it solved. Six dots,
 * three checkpoints under each of two prompts.
 *
 * Deliberately six unconnected dots. Joining a checkpoint's two dots would draw
 * an arrow from tokens to accuracy, and this run cannot support that arrow: the
 * two prompts differ by more than their length. What the figure IS allowed to
 * say is where each named checkpoint sits, which is what the reader could not
 * work out from a card that never said which model it was measuring.
 */
function CostChart() {
  const rows = F3.models;
  /** Rounded so the server and client log10 emit the same string (hydration). */
  const px = (v: number) => Math.round(v * 100) / 100;
  const x = (tokens: number) => px((Math.log10(Math.max(tokens, 1)) / COST_DECADES) * COST_INNER_W);
  const y = (accuracy: number) => px(COST_INNER_H * (1 - (accuracy * 100) / COST_Y_MAX));
  /** A cluster's annotation: centred over its three markers, a few points above the top one. */
  const clusterNote = (tokens: number[], accuracies: number[]) => ({
    x: px(tokens.reduce((a, t) => a + x(t), 0) / tokens.length),
    y: y(Math.max(...accuracies)) - 16,
  });
  const blurtNote = clusterNote(
    rows.map((m) => m.blurtMedianTokens),
    rows.map((m) => m.blurtAccuracy),
  );
  const bareNote = clusterNote(
    rows.map((m) => m.bareMedianTokens),
    rows.map((m) => m.bareAccuracy),
  );

  const points = rows.flatMap((m) => [
    {
      key: `${m.modelId}-blurt`,
      gagged: true,
      shape: shapeOf(m.modelId),
      tokens: m.blurtMedianTokens,
      accuracy: m.blurtAccuracy,
    },
    {
      key: `${m.modelId}-bare`,
      gagged: false,
      shape: shapeOf(m.modelId),
      tokens: m.bareMedianTokens,
      accuracy: m.bareAccuracy,
    },
  ]);

  const describe = (gagged: boolean) =>
    rows
      .map(
        (m) =>
          `${sizeLabel(m.params)} ${gagged ? m.blurtMedianTokens : m.bareMedianTokens} tokens and ${pct(
            gagged ? m.blurtAccuracy : m.bareAccuracy,
          )}`,
      )
      .join(", ");

  return (
    <ChartFrame
      title={`Median tokens written against the share of the same ${F2.bare.n} MATH-500 problems solved, for three Qwen2.5-Instruct checkpoints under two prompts. Non-reasoning: ${describe(true)}. Reasoning: ${describe(false)}.`}
      width={COST_W}
      height={COST_H}
      margin={COST_MARGIN}
      xLabel="median tokens written per problem (log scale)"
      yLabel="percentage of problems solved"
    >
      {/* gridlines: a decade across, with dashed unlabelled minor lines at 2 to 9
          inside each decade (author, 2026-09-27), and ten points up */}
      {COST_X_MINOR.map((v) => (
        <line
          key={`minor-${v}`}
          x1={x(v)}
          x2={x(v)}
          y1={0}
          y2={COST_INNER_H}
          className="stroke-ink-muted opacity-25"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      ))}
      {[0, 1, 2, 3].map((d) => (
        <g key={d}>
          <line
            x1={x(10 ** d)}
            x2={x(10 ** d)}
            y1={0}
            y2={COST_INNER_H}
            className="stroke-grid"
            strokeWidth={1}
          />
          <text
            x={x(10 ** d)}
            y={COST_INNER_H + 16}
            textAnchor="middle"
            className="fill-ink-muted text-[11px] tabular-nums"
          >
            {(10 ** d).toLocaleString("en-GB")}
          </text>
        </g>
      ))}
      {COST_Y_TICKS.map((t) => (
        <g key={t}>
          <line x1={0} x2={COST_INNER_W} y1={y(t / 100)} y2={y(t / 100)} className="stroke-grid" strokeWidth={1} />
          <text
            x={-8}
            y={y(t / 100) + 4}
            textAnchor="end"
            className="fill-ink-muted text-[11px] tabular-nums"
          >
            {t}
          </text>
        </g>
      ))}

      {/* which prompt each cluster is, annotated in the plot just above it (author,
          2026-09-27: no colour key) */}
      <text x={blurtNote.x} y={blurtNote.y} textAnchor="middle" className="fill-wrong-ink text-[11px] font-semibold">
        non-reasoning
      </text>
      <text x={bareNote.x} y={bareNote.y} textAnchor="middle" className="fill-compute-ink text-[11px] font-semibold">
        reasoning
      </text>

      {points.map((p) => (
        <g key={p.key}>
          <Marker
            shape={p.shape}
            cx={x(p.tokens)}
            cy={y(p.accuracy)}
            className={`${p.gagged ? "fill-wrong" : "fill-compute"} stroke-surface`}
            strokeWidth={1.5}
          />
          <text
            x={x(p.tokens) + 11}
            y={y(p.accuracy) + 4}
            className={`text-[10px] tabular-nums ${p.gagged ? "fill-wrong-ink" : "fill-compute-ink"}`}
          >
            {pct(p.accuracy)}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

/* -------------------------------------------------------------------- page */

export function Page5() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [announce, setAnnounce] = useState("");

  // ---- Step 1: the specimen -------------------------------------------
  const [revealed, setRevealed] = useState(false);

  const play = () => {
    recordInteraction(PAGE_N);
    setRevealed(true);
    setAnnounce(
      `System 1 answered ${BLURT_TAB.extractedAnswer} in ${BLURT_TAB.tokensGenerated} tokens; System 2 answered ${BARE_TAB.extractedAnswer} in ${BARE_TAB.tokensGenerated}. The answer is ${F1.groundTruth}.`,
    );
  };

  const reset = () => {
    recordInteraction(PAGE_N);
    setRevealed(false);
    setAnnounce("Both replies cleared.");
  };

  // ---- Step 2: the summary table -------------------------------------
  const T = SUPPRESSION_TABLE;

  return (
    <article className="flex flex-col gap-6">
      <p className="text-xs font-eyebrow uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      {/* The notebook sits right beside the page title: the way to re-derive
          the page, where the page is named. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-bold text-ink">
          <span className="font-mono text-ink-muted">{page.n}. </span>
          {page.title}
        </h1>
        <NotebookDownload href={NOTEBOOK_ZIP} size={NOTEBOOK_SIZE} />
      </div>
      {/* Held to the content column: the margin is the notes column (15rem) plus the
          grid's column gap (2rem), so its right edge meets the body text's. */}
      <p className="text-lg text-ink-muted lg:mr-[17rem]">
        Humans solve complex problems by taking a series of small steps towards the solution. This
        step-by-step approach helps us apply our System&nbsp;2 thinking to problem-solving. It is
        very similar to solving a quadratic equation in clear and simple steps, rather than trying
        to blurt out its solutions.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the definition and the specimen, merged 2026-09-27 under the
            reviewer-response plan (planning/reviewer_response_changes_plan.md,
            page 5, sections 1 and 2). The first paragraph is the author's draft. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. What is the Chain of Thought (CoT) for LLM reasoning?</h2>
          <p className="text-ink">
            We&apos;ve previously illustrated what step-by-step reasoning looks like for a couple of real-world
            problems. <strong>Chain-of-thought prompting</strong> simulates human reasoning by using
            each intermediate step as part of the LLM prompt to generate the next intermediate step.
            <Cite n={REF.wei} /> A common way to ask a model for one is to end the prompt with
            &ldquo;{ZERO_SHOT_COT_TRIGGER}&rdquo;
            <Cite n={REF.kojima} />
          </p>
          <p className="text-ink">
            Today&apos;s models no longer need that phrase, because System&nbsp;2 thinking is their
            default mode. Below, we force <strong>Qwen2.5-3B-Instruct</strong>
            <Cite n={REF.qwen} /> into System&nbsp;1, answering immediately, and compare against
            System&nbsp;2 results.
          </p>
          {/* Figure 1 is a split: the same question put to the same model twice, side
              by side, System 1 on the left and System 2 on the right. No mode buttons;
              Play shows both whole replies at once, with no streaming and no progress
              bar (author, 2026-09-27); Reset clears them. System 1's
              appended instruction is not shown in its question (author, 2026-09-27). */}
          <section
            aria-label="One problem, two prompts"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ChatColumn title="System 1" tab={BLURT_TAB} shown={revealed} />
              <ChatColumn title="System 2" tab={BARE_TAB} shown={revealed} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={play}
                disabled={revealed}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                ▶ Play
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!revealed}
                className="ml-auto rounded bg-wrong px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50"
              >
                ↺ Reset
              </button>
            </div>
          </section>
        </section>
        {/* Beside the merged step: its references. The "Terms" note that defined token
            and greedy decoding moved to the glossary, page 17, on 2026-09-27
            (author); do not bring it back here. */}
        <div className="flex flex-col gap-6">
          <Note kicker="References">
            <RefItem n={REF.wei} href="https://arxiv.org/abs/2201.11903">
              Wei et al. 2022, <em>Chain-of-Thought Prompting Elicits Reasoning in Large Language
              Models</em> (NeurIPS 2022).
            </RefItem>
            <RefItem n={REF.kojima} href="https://arxiv.org/abs/2205.11916">
              Kojima et al. 2022, <em>Large Language Models are Zero-Shot Reasoners</em> (NeurIPS
              2022).
            </RefItem>
            <RefItem n={REF.qwen} href="https://huggingface.co/Qwen/Qwen2.5-3B-Instruct">
              Qwen team 2024, <em>Qwen2.5-3B-Instruct</em> model card (Hugging Face). The 1.5B and
              7B cards sit alongside it.
            </RefItem>
          </Note>
        </div>

        {/* Step 2 — figure 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. System 1 versus System 2 thinking on MATH-500 problems</h2>
          {/* The author's paragraph (2026-09-27). It gives the reasoning side only, with
              the denominator; the switch reveals the rest. Every number is read from the
              run. The Cite marks the problem set, MATH-500. */}
          <p className="text-ink-muted">
            One trace proves nothing, so both prompts were run across {F2.bare.n} problems from the
            same difficulty band.
            <Cite n={REF.math500} /> Below is that comparison: the same model, reasoning against
            non-reasoning. Reasoning, it writes a median of {F2.bare.medianTokens} tokens of working
            and solves <strong className="text-ink">{F2.bare.nCorrect}</strong> of the {F2.bare.n}.
          </p>
          {/* Figure 2 is two stacked bars of the same problems (author, 2026-09-27),
              replacing a 2x2 matrix, which replaced a 100-square grid that read as if
              its first squares were the first problems. Legend above, title below. */}
          <section aria-label="The cost of working with no reasoning">
            <figure className="flex flex-col gap-2">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                {(Object.keys(SEGMENT_STYLE) as (keyof typeof SEGMENT_STYLE)[]).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <svg aria-hidden="true" width="12" height="12">
                      <rect width="12" height="12" rx="2" className={SEGMENT_STYLE[k].fill} />
                    </svg>
                    {SEGMENT_STYLE[k].name}
                  </li>
                ))}
              </ul>
              <SolvedChart />
              <figcaption className="text-center text-base font-semibold text-ink">
                System 1 vs System 2: Qwen2.5-3B-Instruct on {T.n} MATH-500 problems (levels{" "}
                {M.items.eval_levels.join(" and ")})
                <span className="block text-sm font-normal text-ink-muted">
                  How many problems each system solved, and which ones they agree on
                </span>
              </figcaption>
            </figure>
          </section>
        </section>
        {/* The author cut "How to read it" on 2026-09-27, since the figure needs no
            explaining. The dataset's reference moved here from section 4 the same day,
            beside the first place the page names MATH-500. */}
        <Note kicker="References">
          <RefItem n={REF.math500} href="https://huggingface.co/datasets/HuggingFaceH4/MATH-500">
            <em>MATH-500</em> dataset card (Hugging Face): 500 MATH test problems (Hendrycks et
            al. 2021), the subset of Lightman et al. 2023.
          </RefItem>
        </Note>

        {/* Step 3 — figure 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Smaller reasoning models do better than larger non-reasoning models</h2>
          {/* Rewritten 2026-09-27 (author's brief): the paragraph argues one thing, that a
              smaller model in System 2 beats a larger one in System 1. Every claim is
              guarded against the data in Page5.test.tsx: "less than a quarter the size",
              "twice as well", and "every model in System 2 beats every model in System 1"
              (the smallest System 2 score is above the largest System 1 score). */}
          <p className="text-ink-muted">
            Can a bigger model make up for skipping the steps? We ran the same {F2.bare.n} MATH-500
            problems (levels {M.items.eval_levels.join(" and ")}) on a smaller (1.5B) and a larger
            (7B) model from the same family. Forced into
            System&nbsp;1, the 7B solves{" "}
            <strong className="text-ink">{pct(F3.cross.gagged_large_accuracy)}</strong>. In
            System&nbsp;2, the 1.5B solves{" "}
            <strong className="text-ink">{pct(F3.cross.ungagged_small_accuracy)}</strong>: a model
            less than a quarter the size does twice as well, just by writing out its steps. Every
            model in System&nbsp;2 beats every model in System&nbsp;1.
          </p>
          <section
            aria-label="The floor is flat"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={chip}>Qwen2.5-Instruct · 1.5B, 3B, 7B · all bf16</span>
              <span className={chip}>greedy · the same {F2.bare.n} problems</span>
            </div>
            <FloorChart />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-wrong" /> solved with no reasoning
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-compute" /> added by the working
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm bg-wrong opacity-20" /> the floor: all three
                non-reasoning bars end inside it
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-px bg-compute" /> the 1.5B, reasoning
              </span>
            </div>
          </section>
        </section>
        {/* No margin note: the author cut "Limits" on 2026-09-27. This empty cell keeps
            the grid's step / note pairing. */}
        <div aria-hidden="true" />

        {/* Close — figure 4. Every figure above this one is the 3B, and the page
            never said so where it counted. Six dots say it: which checkpoint,
            under which prompt, wrote how much, and solved how many. */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. The (token) cost of a chain of thought</h2>
          {/* Reframed around tokens, author, 2026-09-27. "About 100×" and
              "around 570" are checked against the run in Page5.test.tsx. */}
          <p className="text-ink-muted">
            A chain of thought is not free. In System&nbsp;2, every model below writes about 100×
            as many tokens as in System&nbsp;1, a median of around {BARE_MEDIAN_ROUNDED} per
            problem against {BLURT_MEDIAN_RANGE}.
          </p>
          {/* Moved above the figure, author, 2026-09-27: both paragraphs read before the chart. */}
          <p className="text-ink-muted">
            A hundred times more sounds expensive, but each chain is small. Even across a million
            problems, the {sizeLabel(PRIMARY_ROW.params)}&apos;s chains of thought add up to about a
            hundred-thousandth of what it cost to train the model.
            <Cite n={REF.kaplan} />
            <sup aria-hidden="true" className="text-compute-ink">,</sup>
            <Cite n={REF.qwenReport} />
          </p>
          <section
            aria-label="Tokens written against problems solved"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            {/* The run's ledger, inside the figure it certifies: every vital the
                top plate's mono line used to carry, as label and value pairs
                with the card's full width to breathe in rather than a 15rem
                margin column that wrapped the run id mid-hash. */}
            <dl className="flex flex-wrap gap-x-6 gap-y-1 border-b border-grid pb-3 font-mono text-xs leading-relaxed tabular-nums text-ink-muted">
              <div className="flex gap-2">
                <dt>model</dt>
                <dd className="text-ink">Qwen2.5-Instruct · 1.5B, 3B, 7B · bf16</dd>
              </div>
              <div className="flex gap-2">
                <dt>decoding</dt>
                <dd className="text-ink">
                  {M.decoding.strategy} · {M.decoding.max_new_tokens}-token cap
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>problems</dt>
                <dd className="text-ink">
                  MATH-500 levels {M.items.eval_levels.join(" and ")} · n = {M.items.n} paired
                </dd>
              </div>
              <div className="flex gap-2">
                <dt>output</dt>
                <dd className="text-ink">900 generations</dd>
              </div>
            </dl>
            {/* Shape is the model size, keyed in a legend to the right of the chart
                (author, 2026-09-27). Colour is the prompt, named by annotations inside the
                plot beside each cluster rather than in a key. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <CostChart />
              </div>
              <ul
                aria-label="Model size"
                className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-muted sm:flex-col sm:items-start"
              >
                <li className="font-semibold">model size</li>
                {F3.models.map((m) => (
                  <li key={m.modelId} className="flex items-center gap-1.5">
                    <svg aria-hidden="true" width={14} height={14}>
                      <Marker
                        shape={shapeOf(m.modelId)}
                        cx={7}
                        cy={7.5}
                        className="fill-none stroke-ink-muted"
                        strokeWidth={1.5}
                      />
                    </svg>
                    {sizeLabel(m.params)}
                  </li>
                ))}
              </ul>
            </div>
          </section>
          <Handoff>
            <p className="text-ink">
              {/* Closing line, author, 2026-09-27: no page number (reviewer plan, CP2). The
                  italic handoff question to page 6 was cut by the author the same day. */}
              A chain of thought makes a model better at hard problems, and it charges for that
              in tokens.
            </p>
          </Handoff>
        </section>
        {/* Beside section 4, the one set of numbers on the page that is estimated
            rather than measured, and the sources of the estimate. The model card and
            dataset references moved up to where the page first names them. */}
        <Note kicker="An estimate">
          <p>
            Writing a token takes about 2 operations per parameter; training takes about 6 per
            parameter for every token trained on. Qwen2.5 was trained on up to 18 trillion
            tokens.
          </p>
          <RefItem n={REF.kaplan} href="https://arxiv.org/abs/2001.08361">
            Kaplan et al. 2020, <em>Scaling Laws for Neural Language Models</em> (arXiv).
          </RefItem>
          <RefItem n={REF.qwenReport} href="https://arxiv.org/abs/2412.15115">
            Qwen team 2024, <em>Qwen2.5 Technical Report</em> (arXiv).
          </RefItem>
        </Note>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
