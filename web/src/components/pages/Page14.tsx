"use client";

/**
 * Page 14, "Frontier Reasoners II: DeepSeek-R1, GRPO, and the 'Aha Moment'" —
 * the open-weight answer to the closed frontier. Page 13 closed with four
 * questions it could not answer ("The questions o1 cannot answer") and a
 * handoff promising four deliverables: the algorithm, a readable chain, a
 * training curve showing where the extra thinking comes from, and the
 * distills. This page cashes all four in.
 * The page's one idea: reward ONLY verifiable right answers and the pausing /
 * second-guessing / self-correcting emerges on its own — nobody writes it in.
 *
 * The lede answers rather than restates. Page 13 now builds the demand
 * itself, so the intro must not re-erect the frame (an earlier draft opened
 * "page 13 priced the exchange, then hid the machinery", which duplicated
 * page 13's own section 4). It is held to page 12's length — three clauses:
 * the four questions, the four deliverables, the hook. Two beats an earlier
 * draft spent here were moved down to where they are shown rather than
 * previewed: "no worked examples at all" now opens section 1 beside the
 * recipe that has none, and "taught itself to spend test-time compute nobody
 * told it to spend" is section 2's reading under the training chart. What the
 * lede keeps of the hook is the concrete thing the skeleton draws (a chain
 * that stops mid-solution to re-check), so "backtracking" has a referent
 * before the question asks where it came from.
 * The four do not map one-to-one onto this page's three sections, so the page
 * never promises "answered in order" — the sections answer without
 * announcing. Q1/Q2/Q3 land in section 2, Q4 in section 3; section 1 is the
 * handoff's separate "algorithm in full".
 *
 * The page SHOWS what settles the four; it never recaps them as answers.
 * A closing block that restated each question with its answer was built and
 * cut on review — it read as a quiz key and did the reader's thinking, which
 * is the same academic-paper reflex page 13 rejected when its own ledger went.
 * Do not reintroduce it; Page14.test.tsx guards against it. What carries each
 * question is the thing the reader drives: the scrubber grows a loop (what ten
 * times the thinking is spent on), the skeleton stays ONE chain rather than
 * four parallel ones (what the dial buys), the dot plot puts a 1.5B dot past a
 * closed model's rule (whether the law needs frontier scale). The lede points
 * back at the four so the reader knows what to watch for; exactly one clause later
 * ("the distinction page 13 could only assert") ties a figure back. One
 * thread is a thread, several are a quiz.
 *
 * The narration question is the one with nothing to drive, so it is argued in
 * prose under the skeleton, where the chain is in front of the reader. The
 * argument is structural, not a measurement: in R1-Zero the chain IS the
 * sampled object that training pushed on, so there was never a separate step
 * in which a description could be written beside the real work. Deliberately
 * not reached for: the faithfulness question (whether the chain is an HONEST
 * account is a different claim from whether it is load-bearing). Old page 18
 * owned it and was cut on 2026-08-10; page 15 now raises it as the deck's
 * closing question and this page still does not answer it here.
 *
 * Act 2 callbacks are held to two, and both carry an argument: page 7 at
 * GRPO's line 2, page 10 at the aha loop. Page 13's header records the review
 * instruction "lets not cite everything like page 6, page 7…", so decorative
 * back-references are not to be added here, and there is deliberately NO test
 * asserting a count of page numbers.
 *
 * Step 1 is the recipe, GRPO, abstracted honestly: five lines of annotated
 * pseudocode (sample a group, score with a rule, advantage = distance from
 * the group's own mean) instead of the clipped-surrogate objective. Below
 * it, line 2 of that pseudocode is DRAWN: four answers to page 4's 350 × 638
 * (the model samples stochastically — that is where the group comes from;
 * each wrong answer is a named arithmetic slip, not an invented number), as
 * dots at reward 1/0 with the group mean as a dashed rule and each push as
 * an arrow from the rule to the dot. One dial sets how many of the other
 * three match sample 1's fixed 223,300; as luck rises the rule chases the
 * crowd, the same right answer's arrow shrinks to nothing, the lone
 * dissenter's stretches (rarity cuts both ways), and a uniform group leaves
 * an arrowless picture — nothing to teach. No critic network anywhere: that
 * is what made RL at this scale affordable, and the copy says so against
 * PPO.
 * Between the listing and the PPO paragraph sits the section's deck bridge
 * (lineage before cost): line 2 is page 7's parallel sampling moved across
 * the train/test line. Page 7 paid for many chains at answer time and threw
 * them away after the vote; GRPO runs the same sampling in training and keeps
 * what the winners did in the weights. The claim stops there on purpose —
 * NOT "tomorrow's single sample looks like today's best-of-four", because
 * GRPO is a policy gradient with a group baseline, not best-of-N
 * distillation. Note this listing is now the deck's ONLY training algorithm:
 * page 13's rumored o1 recipe was cut on review 2026-07-30 precisely so that
 * a checkable algorithm never shares a grammar with a hypothesized one, and
 * page 13's section 1 points here for it. Keep this listing honest and keep
 * it printed.
 *
 * Step 2 is the training scrubber over R1-Zero (curves.deepseekTraining),
 * both variables on a dual y-axis: AIME pass@1 (left, 15.6 → 71.0) and
 * average response length (right, ~1k → ~9k tokens). Neither curve is a
 * schedule — no term in the reward mentions length (the chart says so in an
 * annotation); the model buys itself thinking time because re-checking pays.
 * The prose names the right axis as page 11's x axis (test-time compute)
 * with nobody's hand on the dial: the model finds the scaling law itself and
 * walks up it. It also answers page 13's first open question outright, which
 * is the answer no closed model could supply: this is ONE chain allowed to
 * run longer, not many chains sampled and voted behind an API — the
 * distinction page 13's section 2 had to assert and could not prove.
 * Below the chart, the trace is shown as a SHAPE, not text: a skeleton of
 * forward steps early and mid, and past the aha step an interrupt node with
 * a loop back to the trace's own first line and a second, re-deriving pass.
 * The skeleton is the abstraction of the paper's Table-3 trace — structure
 * only, nothing quoted — and it is what the right axis's extra tokens are
 * made of. The paper places the behaviour at "an intermediate version", so
 * where the aha lands on the slider is an illustrative placement — said
 * under the skeleton and again in the footer.
 *
 * The interrupt has a stated REASON (review: it read as the trace hiccupping).
 * Page 10's machinery is branch, SCORE, backtrack; the skeleton drew the
 * branch and the backtrack and no score, so the fourth block of the first
 * pass is now outlined as the step the trace doubts, and STAGE_NOTE.aha names
 * the trigger. Two constraints hold this in place:
 *   - It is DOUBT, never a found mistake. R1's traces re-evaluate rather than
 *     locate an error, and "found a mistake" would contradict section 1's
 *     reward (`rᵢ ← 1 if answerᵢ is right, else 0`, outcome only): nothing
 *     ever scored a step, so nothing could have told the model which was bad.
 *     That is the better story anyway, and it pays off page 9 — pure outcome
 *     reward grew a step-level habit nobody supervised.
 *   - The marked block takes the COMPUTE hue, dashed, never the wrong hue.
 *     Wrong-hue asserts a located error and would undo the above.
 *
 * Step 3 is the give-away, reframed as its actual thesis: reasoning
 * transfers as data. ~800K traces, plain SFT, no RL and no reward — page
 * 12's recipe with a stronger teacher — and six dense models inherit the
 * behaviour (curves.deepseekDistill, Table 5), drawn as a horizontal dot
 * plot: score on the x axis, one row per model ordered by size (teacher at
 * the bottom), closed models as vertical dashed rules because they publish
 * scores but not sizes. Reading down the rows the dots march right through
 * the closed rules, and Llama-70B left of Qwen-32B is a visible kink. Where
 * a dot lands right of a rule, page 11's law has been compressed into
 * weights anyone can download. R1's own scoreboard is
 * deliberately NOT tabled here — one number places the teacher, the rest is
 * beside the point. The closing handoff used to defer that reckoning to a
 * scoreboard page; that page was cut on 2026-08-10, so the handoff now points
 * at what page 15 actually does next, which is the wrong side of the dial.
 *
 * Footer keeps the deck-wide two-label provenance pattern: Simulated (the
 * interpolated curve, the schematic skeleton, the illustrative aha
 * placement) and Cited (every number pinned to DeepSeek-AI 2025).
 */

import { useState } from "react";
import { scaleLinear } from "d3";
import { ChartFrame, CHART_MARGIN } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { ACTS, getPage } from "@/lib/pages";
import { curves, interpolate } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 14;
const MAX_STEP = 8000;
/** Skeleton staging thresholds on the scrubber (illustrative placement — see
    the provenance line under the skeleton). */
const MID_STEP = 2500;
const AHA_STEP = 5000;

/** Page 14's references, numbered in order of first appearance. */
const REF = { r1: 1, grpo: 2 } as const;

/*
 * Page 4's multiplication, not page 1's. The figure's own punchline (a uniform
 * group teaches nothing) rules out an easy problem: 17 × 24 is exactly what a
 * 671B model already aces, so using it as the example of a PRODUCTIVE learning
 * group contradicted the caption three lines below. Page 4 sets the precedent
 * for the fix — it recalls page 1's 17 × 24 and escalates to 350 × 638 — and
 * the escalation earns a second callback besides: page 4 walked three human
 * roads to 223,300, and this figure watches a model sample four.
 *
 * Sample 1 always gets it right; the other three slots have fixed wrong
 * answers so the dial is deterministic, and each is a real arithmetic slip,
 * not an invented number:
 *   350 × 628 = 219,800 (one digit misread)
 *    35 × 638 =  22,330 (a dropped zero)
 *   210,000 + 13,300 written as 213,300 (the partials mis-added)
 */
const RIGHT_ANSWER = "223,300";
const OTHER_WRONGS = [
  { v: "219,800", slip: "read 638 as 628" },
  { v: "22,330", slip: "dropped a zero" },
  { v: "213,300", slip: "mis-added the partials" },
];

/** The GRPO recipe as five annotated lines — the honest abstraction of the
    objective (advantage from the group's own statistics), minus the clipped
    surrogate machinery. */
const PSEUDO: { code: string; note?: string }[] = [
  { code: "for each problem q:" },
  { code: "  sample G answers from the current policy" },
  { code: "  rᵢ ← 1 if answerᵢ is right, else 0", note: "the reward is a program, not a second model" },
  { code: "  Aᵢ ← (rᵢ − mean(r)) / std(r)", note: "the group is its own baseline: no critic network" },
  { code: "  push toward answers with Aᵢ > 0, away from Aᵢ < 0", note: "plus a leash (KL) back to the reference model" },
];

type Stage = "early" | "mid" | "aha";

const STAGE_CHIP: Record<Stage, string> = {
  early: "early in training",
  mid: "mid training",
  aha: "after the aha",
};
const STAGE_NOTE: Record<Stage, string> = {
  early: "A few steps forward, an answer, stop. Nothing looks back.",
  mid: "Longer now, more algebra per attempt, but still strictly forward: whatever was written first, stands.",
  aha: "Four steps in, the trace stops, doubts what it has just written, and goes back to its own first line to derive it again. Nothing scored those steps: the reward only sees the final answer, so nobody told the model that its last step was shaky. It learned to suspect itself anyway, because re-checking lands more right answers and right answers are all the reward pays. Page 10's branch, score, backtrack, with the harness deleted and the scoring moved inside the chain. The extra tokens on the right axis are these loops.",
};

interface Distill {
  size: number;
  label: string;
  family: "qwen" | "llama";
  note: string;
}
const DISTILLS: Distill[] = [
  { size: 1.5, label: "Qwen-1.5B", family: "qwen", note: "beats GPT-4o on AIME, from a model that fits on a phone" },
  { size: 7, label: "Qwen-7B", family: "qwen", note: "most of the way to o1-mini, at laptop scale" },
  { size: 8, label: "Llama-8B", family: "llama", note: "a Llama base instead of Qwen: the same traces teach a different family" },
  { size: 14, label: "Qwen-14B", family: "qwen", note: "clears the best open reasoning model that existed the week before, at under half its size" },
  { size: 32, label: "Qwen-32B", family: "qwen", note: "within seven points of the 671B teacher" },
  { size: 70, label: "Llama-70B", family: "llama", note: "bigger is not automatically better: the 32B Qwen edges it" },
];

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

const fmtPush = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(2)}`;

/**
 * Line 2 of the recipe, drawn. Four sampled answers as dots at reward 1 or
 * 0, the group mean as a dashed rule (the deck's reference-rule idiom), and
 * each sample's push as an arrow FROM the rule TO its dot — the push
 * literally is the sample's distance from the group's own average. As the
 * dial raises the group's luck the rule chases the right answers: up-arrows
 * shrink, the lone dissenter's arrow stretches, and at a uniform group the
 * rule reaches the dots and every arrow vanishes.
 */
function GroupBaselineChart({ rewards, mean }: { rewards: number[]; mean: number }) {
  /*
   * The viewBox is sized close to the column it renders into (~615px at the
   * deck's desktop width). ChartFrame scales to width="100%", so a viewBox
   * much wider than its container shrinks every label with it — at 720 the
   * 9px slip captions rendered near 7px and the figure read as unreadable.
   */
  const width = 620;
  /* top margin carries the problem, which used to be a text block above the
     figure; the height grew with it so the plot itself did not shrink */
  const height = 288;
  /* right margin holds "group mean · 0.50" at 11px, which needs ~100px clear */
  const margin = { top: 42, right: 106, bottom: 56, left: 62 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const yOf = (r: number) => 12 + (1 - r) * (innerH - 24);
  const colX = (i: number) => (innerW * (i + 0.5)) / 4;
  const dotR = 7;

  const k = rewards.slice(1).filter((r) => r === 1).length;
  const title = `Line 2 of the recipe, drawn: four answers to 350 times 638 sampled from the model, as dots at reward 1 or reward 0, with the group mean as a dashed horizontal rule and each sample's push as an arrow from the rule to its dot. Sample 1 answers 223,300, correct. The wrong answers are real slips: 219,800 from reading 638 as 628, 22,330 from dropping a zero, 213,300 from mis-adding the partials. Currently ${k} of the other three samples are also right: the group mean is ${mean.toFixed(2)}, so each right answer's push is +${(1 - mean).toFixed(2)} and each wrong answer's is −${mean.toFixed(2)}.${
    k === 3 ? " The rule sits on the dots and every arrow has vanished: a uniform group teaches nothing." : ""
  }`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin}>
      {/* the problem, inside the frame: it was a text block above the figure */}
      <text x={0} y={-24} textAnchor="start" className="fill-ink font-mono text-[13px] font-semibold">
        350 × 638 = ?
      </text>
      <text x={0} y={-10} textAnchor="start" className="fill-ink-muted text-[10px]">
        the rule checks one thing: does the answer equal 223,300?
      </text>

      {/* reward axis: two ticks are the whole scale */}
      {[1, 0].map((t) => (
        <g key={t}>
          <line x1={0} x2={innerW} y1={yOf(t)} y2={yOf(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-8} y={yOf(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[11px]">
            reward {t}
          </text>
        </g>
      ))}

      {/* the group mean: the baseline, as the deck's dashed reference rule */}
      <line
        x1={0}
        x2={innerW}
        y1={yOf(mean)}
        y2={yOf(mean)}
        className="stroke-ink"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={innerW + 8} y={yOf(mean)} dy="0.32em" textAnchor="start" className="fill-ink text-[11px] font-semibold">
        group mean · {mean.toFixed(2)}
      </text>

      {/* one column per sample: dot, push arrow, labels */}
      {rewards.map((r, i) => {
        const px = colX(i);
        const py = yOf(r);
        const adv = r - mean;
        const right = r === 1;
        const wrong = OTHER_WRONGS[i - 1];
        const up = adv > 0;
        const yFrom = yOf(mean) + (up ? -2 : 2);
        const yTo = py + (up ? dotR + 3 : -(dotR + 3));
        return (
          <g key={i}>
            {adv !== 0 ? (
              <g className={up ? "stroke-correct fill-correct" : "stroke-wrong fill-wrong"}>
                <line x1={px} x2={px} y1={yFrom} y2={yTo + (up ? 4 : -4)} strokeWidth={2} />
                <polygon
                  points={`${px},${yTo} ${px - 3.5},${yTo + (up ? 6 : -6)} ${px + 3.5},${yTo + (up ? 6 : -6)}`}
                  stroke="none"
                />
                <text
                  x={px + 9}
                  y={(yFrom + yTo) / 2}
                  dy="0.32em"
                  textAnchor="start"
                  stroke="none"
                  className={`font-mono text-[11px] font-semibold ${up ? "fill-correct" : "fill-wrong"}`}
                >
                  {fmtPush(adv)}
                </text>
              </g>
            ) : null}
            {i === 0 ? (
              <circle cx={px} cy={py} r={dotR + 4} fill="none" className="stroke-compute" strokeWidth={1.5} />
            ) : null}
            <circle
              cx={px}
              cy={py}
              r={dotR}
              className={`${right ? "fill-correct" : "fill-wrong"} stroke-canvas`}
              strokeWidth={1.5}
            />
            <text x={px} y={innerH + 16} textAnchor="middle" className="fill-ink-muted text-[10px] uppercase tracking-wide">
              sample {i + 1}
            </text>
            <text x={px} y={innerH + 31} textAnchor="middle" className="fill-ink font-mono text-[13px] font-semibold">
              {right ? RIGHT_ANSWER : wrong.v}
            </text>
            <text
              x={px}
              y={innerH + 45}
              textAnchor="middle"
              className={i === 0 ? "fill-compute text-[10px] font-semibold" : "fill-ink-muted text-[10px]"}
            >
              {i === 0 ? "watch this one" : right ? "" : wrong.slip}
            </text>
          </g>
        );
      })}
    </ChartFrame>
  );
}

/** A small legend swatch + label (page-11 idiom). */
function Key({ shape, className, label }: { shape: "circle" | "diamond" | "line" | "dash"; className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className={`inline-block ${
          shape === "line"
            ? "h-0.5 w-4"
            : shape === "dash"
              ? "h-0 w-4 border-t border-dashed"
              : shape === "diamond"
                ? "h-3 w-3 rotate-45"
                : "h-3 w-3 rounded-full"
        } ${className}`}
      />
      {label}
    </span>
  );
}

/**
 * The section-2 chart: BOTH of the section's variables against training step.
 * Accuracy (left axis, correct hue) saturates while average response length
 * (right axis, compute hue) keeps climbing — that divergence is the argument,
 * so both series live on one plot, and an annotation under the length curve
 * states the fact the divergence rests on: no term in the reward mentions
 * length. A dashed rule marks the (illustrative) aha step so the chart and
 * the skeleton below are visibly the same moment.
 */
function TrainingChart({ step, pass, length }: { step: number; pass: number; length: number }) {
  const training = curves.deepseekTraining;
  const { lengthStart, lengthEnd } = training.fit!.params;

  const width = 720;
  const height = 320;
  const margin = { ...CHART_MARGIN, right: 44 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const x = scaleLinear().domain([0, MAX_STEP]).range([0, innerW]);
  const yAcc = scaleLinear().domain([0, 90]).range([innerH, 0]);
  const yLen = scaleLinear().domain([0, 10000]).range([innerH, 0]);

  const lengthAt = (s: number) => lengthStart + (lengthEnd - lengthStart) * (s / MAX_STEP);
  const accPath = training.points.map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yAcc(p.y)}`).join("");
  const lenPath = training.points
    .map((p, i) => `${i ? "L" : "M"}${x(p.x)},${yLen(lengthAt(p.x))}`)
    .join("");

  const title = `R1-Zero across RL training, two y axes. Left axis, AIME 2024 pass at 1: from 15.6 percent at step 0 to 71.0 percent at step ${MAX_STEP}, flattening late. Right axis, average response length: from about ${lengthStart.toLocaleString()} to about ${lengthEnd.toLocaleString()} tokens, still climbing after accuracy flattens; annotations note that no term in the reward mentions length and that nobody is turning this dial; the axis is labelled as page 11's test-time compute. A dashed rule at step ${AHA_STEP.toLocaleString()} marks where the aha trace appears (illustrative placement). Marker at step ${step.toLocaleString()}: ${pass.toFixed(1)} percent, about ${length.toLocaleString()} tokens.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="RL training step">
      {/* gridlines + left (accuracy) ticks */}
      {[0, 20, 40, 60, 80].map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={yAcc(t)} y2={yAcc(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-6} y={yAcc(t)} dy="0.32em" textAnchor="end" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}
      {/* right (length) ticks, in the length line's hue */}
      {[0, 5000, 10000].map((t) => (
        <text
          key={`r${t}`}
          x={innerW + 6}
          y={yLen(t)}
          dy="0.32em"
          textAnchor="start"
          className="fill-compute text-[10px]"
        >
          {t === 0 ? "0" : `${t / 1000}k`}
        </text>
      ))}
      {[0, 2000, 4000, 6000, 8000].map((t) => (
        <text key={`x${t}`} x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
          {t === 0 ? "0" : `${t / 1000}k`}
        </text>
      ))}

      {/* axis titles, color-bound to their series */}
      <text
        transform={`translate(-32,${innerH / 2}) rotate(-90)`}
        textAnchor="middle"
        className="fill-correct text-xs"
      >
        pass@1 (%)
      </text>
      {/* the right axis names itself in the deck's terms: this IS page 11's x
          axis. It used to cost a whole sentence of prose above the figure. */}
      <text
        transform={`translate(${innerW + 36},${innerH / 2}) rotate(90)`}
        textAnchor="middle"
        className="fill-compute text-xs"
      >
        avg response (tokens) · page 11&apos;s test-time compute
      </text>

      {/* the aha step: the chart's moment is the skeleton's moment */}
      <line
        x1={x(AHA_STEP)}
        x2={x(AHA_STEP)}
        y1={0}
        y2={innerH}
        className="stroke-ink-muted"
        strokeWidth={1}
        strokeDasharray="4 3"
      />
      <text x={x(AHA_STEP) + 4} y={12} textAnchor="start" className="fill-ink-muted text-[10px]">
        the aha appears
      </text>

      <path d={lenPath} fill="none" className="stroke-compute" strokeWidth={2.5} />
      <path d={accPath} fill="none" className="stroke-correct" strokeWidth={2.5} />

      {/* the fact the divergence rests on, said in the length line's hue */}
      <text
        x={innerW * 0.42}
        y={innerH - 24}
        textAnchor="middle"
        className="fill-compute text-[10px]"
      >
        no term in the reward mentions length
      </text>
      <text
        x={innerW * 0.42}
        y={innerH - 11}
        textAnchor="middle"
        className="fill-compute text-[10px] font-semibold"
      >
        nobody is turning this dial
      </text>

      {/* legend, top-left (the curves start bottom-left) */}
      <rect x={8} y={8} width={10} height={3} className="fill-correct" />
      <text x={22} y={12} className="fill-ink text-[10px]">AIME pass@1 · left axis</text>
      <rect x={8} y={22} width={10} height={3} className="fill-compute" />
      <text x={22} y={26} className="fill-ink text-[10px]">avg response length · right axis</text>

      {/* the slider's marker, dotted onto both series */}
      <line
        x1={x(step)}
        x2={x(step)}
        y1={0}
        y2={innerH}
        className="stroke-compute"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <circle cx={x(step)} cy={yLen(length)} r={5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
      <circle cx={x(step)} cy={yAcc(pass)} r={5} className="fill-correct stroke-canvas" strokeWidth={1.5} />
    </ChartFrame>
  );
}

/** Geometry shared by the skeleton's rows. */
const SK_BLOCK_W = 46;
const SK_BLOCK_H = 16;
const SK_GAP = 16;
const skX = (i: number) => 8 + i * (SK_BLOCK_W + SK_GAP);

/** One row of forward steps: neutral blocks joined by arrows, optionally
    dashed (the aha's second pass) and optionally ending in an answer pill. */
function SkeletonRow({
  y,
  count,
  dashed = false,
  answer = false,
  answerCorrect = false,
}: {
  y: number;
  count: number;
  dashed?: boolean;
  answer?: boolean;
  answerCorrect?: boolean;
}) {
  const mid = y + SK_BLOCK_H / 2;
  return (
    <g>
      {Array.from({ length: count }, (_, i) => (
        <g key={i}>
          <rect
            x={skX(i)}
            y={y}
            width={SK_BLOCK_W}
            height={SK_BLOCK_H}
            rx={3}
            className={dashed ? "stroke-correct" : "fill-grid"}
            fill={dashed ? "none" : undefined}
            strokeDasharray={dashed ? "3 2" : undefined}
          />
          {i < count - 1 || answer ? (
            <line
              x1={skX(i) + SK_BLOCK_W + 2}
              x2={skX(i + 1) - 5}
              y1={mid}
              y2={mid}
              className="stroke-ink-muted"
              strokeWidth={1}
              markerEnd="url(#skel-fwd)"
            />
          ) : null}
        </g>
      ))}
      {answer ? (
        <g>
          <rect
            x={skX(count)}
            y={y}
            width={58}
            height={SK_BLOCK_H}
            rx={SK_BLOCK_H / 2}
            fill="none"
            className={answerCorrect ? "stroke-correct" : "stroke-ink-muted"}
          />
          <text
            x={skX(count) + 29}
            y={mid}
            dy="0.32em"
            textAnchor="middle"
            className={`text-[9px] ${answerCorrect ? "fill-correct" : "fill-ink-muted"}`}
          >
            answer
          </text>
        </g>
      ) : null}
    </g>
  );
}

/**
 * The trace as a shape, no text. Early and mid are strictly forward chains
 * of different lengths; the aha stage adds the only structure that matters:
 * an interrupt node and a loop back to the trace's own first line, then a
 * second, re-deriving pass. This is the abstraction of the paper's Table-3
 * trace — the structure it exhibits, not the words it uses.
 */
function TraceSkeleton({ stage }: { stage: Stage }) {
  const label =
    stage === "early"
      ? "Trace skeleton, early in training: three steps forward, then an answer. Nothing looks back. Schematic, structure only, no text."
      : stage === "mid"
        ? "Trace skeleton, mid training: six steps forward, then an answer. Longer, still strictly forward. Schematic, structure only, no text."
        : "Trace skeleton after the aha: four steps forward, the last of them outlined as the step the trace doubts, then the trace interrupts itself and loops back to its own first line; a second pass of five dashed steps re-derives the solution and ends in an answer. Schematic, structure only, no text.";

  const height = stage === "aha" ? 140 : 52;

  return (
    <svg role="img" aria-label={label} viewBox={`0 0 560 ${height}`} className="w-full">
      <defs>
        <marker id="skel-fwd" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
          <path d="M0,0 L5,3 L0,6" fill="none" className="stroke-ink-muted" strokeWidth={1} />
        </marker>
        <marker id="skel-loop" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
          <path d="M0,0 L6,3.5 L0,7" fill="none" className="stroke-correct" strokeWidth={1.2} />
        </marker>
      </defs>

      <text x={8} y={14} className="fill-ink-muted text-[9px] uppercase tracking-wide">
        {stage === "aha" ? "first pass" : "one pass"}
      </text>

      {stage === "early" ? <SkeletonRow y={22} count={3} answer /> : null}
      {stage === "mid" ? <SkeletonRow y={22} count={6} answer /> : null}

      {stage === "aha" ? (
        <g>
          {/* first pass: four steps, then the interrupt */}
          <SkeletonRow y={22} count={4} />
          {/*
           * The step the trace is about to doubt, marked so the interrupt has a
           * visible reason. Compute hue, dashed: attention, not error. It must
           * never take the wrong hue — nothing ever scored this step (the reward
           * sees only the final answer), so asserting a located mistake here
           * would contradict the outcome-only reward in section 1.
           */}
          <rect
            x={skX(3)}
            y={22}
            width={SK_BLOCK_W}
            height={SK_BLOCK_H}
            rx={3}
            fill="none"
            className="stroke-compute"
            strokeWidth={1.5}
            strokeDasharray="3 2"
          />
          <line
            x1={skX(3) + SK_BLOCK_W + 2}
            x2={skX(4) - 5}
            y1={30}
            y2={30}
            className="stroke-ink-muted"
            strokeWidth={1}
            markerEnd="url(#skel-fwd)"
          />
          <rect x={skX(4)} y={22} width={64} height={SK_BLOCK_H} rx={3} fill="none" className="stroke-correct" strokeWidth={1.5} />
          <text x={skX(4) + 32} y={30} dy="0.32em" textAnchor="middle" className="fill-correct text-[9px] font-semibold">
            interrupt
          </text>

          {/* the loop: back to the trace's own first line */}
          <path
            d={`M ${skX(4) + 32} 42 C ${skX(4) + 32} 76, 30 54, 30 90`}
            fill="none"
            className="stroke-correct"
            strokeWidth={1.5}
            markerEnd="url(#skel-loop)"
          />
          <text x={160} y={82} textAnchor="middle" className="fill-correct text-[9px]">
            back to line 1
          </text>

          {/* second pass: re-derivation, ending in the answer */}
          <SkeletonRow y={96} count={5} dashed answer answerCorrect />
          <text x={8} y={130} className="fill-ink-muted text-[9px] uppercase tracking-wide">
            second pass
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/**
 * The section-3 chart, reframed for the section's thesis. Score is the axis;
 * size is just row order. One row per distilled model (smallest at the top),
 * the 671B teacher as the bottom row, and the closed models as vertical
 * dashed rules — they have scores but no disclosed sizes, so rules, not
 * rows. Reading down the rows, the dots march right through the closed
 * models' rules as size grows; Llama-70B sitting left of Qwen-32B is a
 * visible kink. Clicking a row (or a chip below) picks it.
 */
function DistillDotPlot({ picked, onPick }: { picked: number; onPick: (size: number) => void }) {
  const distill = curves.deepseekDistill;
  const P = distill.fit!.params;
  const aimeOf = (size: number) => distill.points.find((p) => p.x === size)!.y;

  const width = 720;
  const height = 280;
  const margin = { top: 26, right: 16, bottom: 40, left: 118 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const x = scaleLinear().domain([0, 90]).range([0, innerW]);
  const rows = DISTILLS.length + 1;
  const rowH = innerH / rows;
  const rowY = (i: number) => (i + 0.5) * rowH;

  const title = `AIME 2024 pass at 1 as a horizontal dot plot, one row per model, smallest at the top. Rows: ${DISTILLS.map(
    (d) => `${d.label} ${aimeOf(d.size)} percent`,
  ).join(", ")}, and the R1 teacher, a ${P.teacherParamsB}B mixture-of-experts, at ${P.r1Aime} percent. Dashed vertical rules mark closed models with undisclosed sizes: GPT-4o at ${P.gpt4oAime} percent and OpenAI o1-mini at ${P.o1miniAime} percent; a dotted rule marks the teacher's score. Reading down the rows, the dots move right past the closed-model rules; Llama-70B sits left of Qwen-32B. ${DISTILLS.find((d) => d.size === picked)?.label} is selected.`;

  return (
    <ChartFrame title={title} width={width} height={height} margin={margin} xLabel="AIME 2024 pass@1 (%)">
      {/* vertical gridlines + x ticks */}
      {[0, 20, 40, 60, 80].map((t) => (
        <g key={`x${t}`}>
          <line x1={x(t)} x2={x(t)} y1={0} y2={innerH} className="stroke-grid" strokeWidth={0.5} />
          <text x={x(t)} y={innerH + 14} textAnchor="middle" className="fill-ink-muted text-[10px]">
            {t}
          </text>
        </g>
      ))}

      {/* closed models: rules, not rows — their sizes are undisclosed */}
      {[
        { label: "GPT-4o", v: P.gpt4oAime, anchor: "start" as const, dx: 4 },
        { label: "o1-mini", v: P.o1miniAime, anchor: "end" as const, dx: -4 },
      ].map((r) => (
        <g key={r.label}>
          <line
            x1={x(r.v)}
            x2={x(r.v)}
            y1={0}
            y2={innerH}
            className="stroke-ink-muted"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <text
            x={x(r.v) + r.dx}
            y={-8}
            textAnchor={r.anchor}
            className="fill-ink-muted text-[10px]"
          >
            {r.label} · {r.v}%
          </text>
        </g>
      ))}

      {/* the teacher's score, ruled so "within seven points" is visible */}
      <line
        x1={x(P.r1Aime)}
        x2={x(P.r1Aime)}
        y1={0}
        y2={innerH}
        className="stroke-correct"
        strokeWidth={1}
        strokeDasharray="2 3"
      />
      <text x={x(P.r1Aime) - 4} y={-8} textAnchor="end" className="fill-correct text-[10px]">
        R1 teacher · {P.r1Aime}%
      </text>

      {/* the six distills, one row each */}
      {DISTILLS.map((d, i) => {
        const py = rowY(i);
        const px = x(aimeOf(d.size));
        const active = d.size === picked;
        return (
          <g key={d.size} onClick={() => onPick(d.size)} className="cursor-pointer" aria-hidden="true">
            <rect x={-margin.left} y={py - rowH / 2} width={margin.left + innerW} height={rowH} fill="transparent" />
            <line x1={0} x2={innerW} y1={py} y2={py} className="stroke-grid" strokeWidth={0.5} />
            <text
              x={-8}
              y={py}
              dy="0.32em"
              textAnchor="end"
              className={`text-[10px] ${active ? "fill-ink font-semibold" : "fill-ink-muted"}`}
            >
              {d.label}
            </text>
            {active ? <circle cx={px} cy={py} r={9} fill="none" className="stroke-ink" strokeWidth={1.5} /> : null}
            {d.family === "llama" ? (
              <rect
                x={px - 4}
                y={py - 4}
                width={8}
                height={8}
                transform={`rotate(45 ${px} ${py})`}
                className="fill-wrong stroke-canvas"
                strokeWidth={1.5}
              />
            ) : (
              <circle cx={px} cy={py} r={4.5} className="fill-compute stroke-canvas" strokeWidth={1.5} />
            )}
            {active ? (
              <text x={px + 13} y={py} dy="0.32em" textAnchor="start" className="fill-ink text-[10px] font-semibold">
                {aimeOf(d.size).toFixed(1)}%
              </text>
            ) : null}
          </g>
        );
      })}

      {/* the teacher's row, at the bottom: the biggest model, the rightmost dot */}
      <g aria-hidden="true">
        <line x1={0} x2={innerW} y1={rowY(rows - 1)} y2={rowY(rows - 1)} className="stroke-grid" strokeWidth={0.5} />
        <text x={-8} y={rowY(rows - 1)} dy="0.32em" textAnchor="end" className="fill-ink text-[10px] font-semibold">
          R1 teacher · {P.teacherParamsB}B
        </text>
        <circle cx={x(P.r1Aime)} cy={rowY(rows - 1)} r={6} className="fill-correct stroke-canvas" strokeWidth={1.5} />
      </g>
    </ChartFrame>
  );
}

export function Page14() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const training = curves.deepseekTraining;
  const distill = curves.deepseekDistill;
  const { cons64, lengthStart, lengthEnd } = training.fit!.params;
  const P = distill.fit!.params;

  const [step, setStep] = useState(0);
  const [pickedSize, setPickedSize] = useState(14);
  /* — step 1: how many of the OTHER three samples also get 223,300 — */
  const [luck, setLuck] = useState(1);

  const rewards: number[] = [1, ...OTHER_WRONGS.map((_, i) => (i < luck ? 1 : 0))];
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const uniform = luck === 3;
  const push1 = 1 - mean;
  const setLuckAnd = (v: number) => {
    setLuck(v);
    recordInteraction(PAGE_N);
  };
  const LUCK_READ: Record<number, string> = {
    0: `Sample 1 is the only right answer in the group: the biggest push on offer (+${push1.toFixed(2)}).`,
    1: `Same right answer, luckier group: sample 1's push drops to +${push1.toFixed(2)}.`,
    2: `Luckier still: +${push1.toFixed(2)}. Now watch sample 4: a wrong answer in a mostly-right group is punished hardest (−${mean.toFixed(2)}). Rarity amplifies the signal in both directions.`,
    3: "",
  };

  /* — step 2: the scrubber — */
  const pass = interpolate(training, step);
  const length = Math.round(lengthStart + (lengthEnd - lengthStart) * (step / MAX_STEP));
  const stage: Stage = step >= AHA_STEP ? "aha" : step >= MID_STEP ? "mid" : "early";

  /* — step 3: the distills — */
  const picked = DISTILLS.find((d) => d.size === pickedSize)!;
  const paramRatio = Math.round(P.teacherParamsB / picked.size);
  const pick = (size: number) => {
    setPickedSize(size);
    recordInteraction(PAGE_N);
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
        Page 13 closed with four questions about what sits behind the thinking dial, and no way to
        answer any of them from outside. In January 2025 DeepSeek published all of it: algorithm,
        weights, training curve, and a chain that stops mid-solution to re-check its own work.{" "}
        <strong className="text-ink">Where does the backtracking come from?</strong>
        <Cite n={REF.r1} />
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the recipe */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. The recipe: the group grades itself
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              GRPO · rule-based reward · no worked examples
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            <p className="text-ink">
              <strong>R1-Zero</strong> deletes the usual supervised warm-up entirely and starts RL
              from a plain base model, with <strong>no worked examples at all</strong>: only
              problems whose final answers can be checked. The whole recipe,{" "}
              <strong>Group Relative Policy Optimization</strong>, fits in five lines:
              <Cite n={REF.grpo} />
            </p>

            <figure className="m-0 flex flex-col gap-2">
              <div className="flex flex-col gap-1 rounded-lg border border-dashed border-grid bg-surface-raised p-3 font-mono text-sm">
                {PSEUDO.map((line, i) => (
                  <div key={i} className="flex flex-wrap items-baseline gap-x-3">
                    <code className="whitespace-pre text-ink">{line.code}</code>
                    {line.note ? (
                      <span className="text-xs text-compute">{`# ${line.note}`}</span>
                    ) : null}
                  </div>
                ))}
              </div>
              {/* the PPO contrast, as a note ON the code rather than a fourth
                  body paragraph: one fact, one sentence (review) */}
              <figcaption className="text-xs text-ink-muted">
                no critic network anywhere, which at 671B parameters is what made RL at this scale
                affordable: PPO, the standard alternative, learns its baseline from a second
                network about as large as the policy itself
              </figcaption>
            </figure>

            <p className="text-ink">
              Line 2 should look familiar. <strong>Page 7 sampled many chains and picked among
              them at answer time</strong>, then threw every sample away once the vote was
              counted. GRPO runs the same sampling during training and keeps what the winners did
              in the weights: sampling paid for once, instead of on every question.
            </p>

            {/*
             * The section's central figure, at full card width in page 11's
             * grammar: figure, fine-print line, dial beneath. It used to sit
             * inside a nested dashed card, whose padding stacked on the
             * section card's and squeezed the chart into a column narrow
             * enough to shrink every label past reading (review).
             */}
            {/*
             * The chart's own setup used to be three blocks above it: the
             * problem line, a paragraph saying the wrong answers are real
             * slips, and the drag instruction. The problem is now the chart's
             * title, the slip labels under each dot already make the second
             * point, and the instruction moved to the margin Try-it note,
             * which is page 2's grammar and which this section lacked.
             */}
            <figure className="m-0 flex flex-col gap-2 border-t border-dashed border-grid pt-4">
              <GroupBaselineChart rewards={rewards} mean={mean} />
              <figcaption className="text-xs text-ink-muted">
                each sample&apos;s push is its distance from the dashed rule, its reward minus the
                group mean (GRPO then divides by the group&apos;s spread)
              </figcaption>
            </figure>

            <div className="flex flex-col gap-3">
              <Slider
                label="of the other three samples, how many are also right"
                min={0}
                max={3}
                step={1}
                ticks={[0, 1, 2, 3]}
                value={luck}
                onChange={setLuckAnd}
              />
              {uniform ? (
                <p className="rounded border-l-4 border-compute bg-surface-raised p-2 text-sm text-ink">
                  The limit of that trend: everyone scored the same, so every push is{" "}
                  <span className="font-mono">0.00</span>. A problem the model already aces, or
                  is hopeless on, teaches it nothing. Learning lives where the group disagrees.
                </p>
              ) : (
                <p className="text-sm text-ink">{LUCK_READ[luck]}</p>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-8">
          <Note kicker="Try it">
            <p>
              Drag the dial: the group&apos;s luck changes, sample 1&apos;s answer never does.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.r1} href="https://arxiv.org/abs/2501.12948">
              DeepSeek-AI 2025, <em>DeepSeek-R1: Incentivizing Reasoning Capability in LLMs via
              Reinforcement Learning</em>.
            </RefItem>
            <RefItem n={REF.grpo} href="https://arxiv.org/abs/2402.03300">
              Shao et al. 2024, <em>DeepSeekMath</em> (GRPO).
            </RefItem>
          </Note>
        </div>

        {/* Step 2 — the scrubber */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Scrub through R1-Zero&apos;s training
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              AIME 2024 · pass@1 · DeepSeek-AI 2025
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4">
            {/* setup only: the meaning moved below the chart, where the reader
                can check it against what they are looking at (review) */}
            <p className="text-ink">
              Nothing in the recipe mentions reflection. Nothing in the reward mentions length.{" "}
              <strong>Watch both curves anyway.</strong>
            </p>

            <div className="flex flex-col gap-4">
              <Slider
                label="RL training step"
                min={0}
                max={MAX_STEP}
                step={500}
                value={step}
                onChange={(v) => {
                  setStep(v);
                  recordInteraction(PAGE_N);
                }}
              />
              <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                <div>
                  <p className="font-mono text-5xl font-bold tabular-nums text-correct">
                    {pass.toFixed(1)}%
                  </p>
                  <p className="text-xs text-ink-muted">AIME 2024 pass@1</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold tabular-nums text-compute">
                    ≈{length.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-muted">avg response tokens</p>
                </div>
                <p className="min-w-[16rem] flex-1 text-sm text-ink-muted">
                  From 15.6% to 71.0% pass@1 with no supervised examples. Add page 7&apos;s
                  majority vote across 64 samples and it reaches{" "}
                  <strong className="text-ink">{cons64}%</strong>, level with OpenAI-o1-0912.
                  <Cite n={REF.r1} />
                </p>
              </div>
              <TrainingChart step={step} pass={pass} length={length} />
            </div>

            {/* the meaning, after the evidence */}
            <p className="text-ink">
              Length is not a schedule anyone set: longer, re-checking traces win more reward, so
              the model <strong>buys itself more thinking time</strong>. The skeleton below shows
              what the extra tokens are made of.
            </p>

            {/* the trace, as a shape */}
            <div className="flex flex-col gap-2 rounded-lg border border-dashed border-grid bg-surface-raised p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  the trace, as a shape · {STAGE_CHIP[stage]}
                </p>
                <p className="font-mono text-xs tabular-nums text-compute">
                  ≈{length.toLocaleString()} tokens
                </p>
              </div>
              <TraceSkeleton stage={stage} />
              <p className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
                {STAGE_NOTE[stage]}
              </p>
            </div>
            {/* the one-chain point belongs here, beside a single unbroken trace,
                not three blocks above the chart where it used to sit */}
            <p className="text-ink">
              Count the traces: there is <strong>one</strong>, allowed to run longer. Not many
              chains sampled and voted on behind an API, which is the distinction page 13 could
              only assert.
            </p>
            <p className="text-ink">
              Notice what the loops rule out. A chain nobody can read might be a running commentary
              written beside the real work, and from outside there is no way to tell.{" "}
              <strong>
                These tokens cannot be that: the chain is what the model sampled and what training
                pushed on
              </strong>
              , and no separate step ever wrote a description of anything. Re-derivation is not
              narration, and the score climbs as the loops arrive.
            </p>
            <p className="text-xs text-ink-muted">
              the skeleton abstracts the trace in Table 3 of DeepSeek-AI 2025, where R1-Zero
              interrupts a solution mid-stream, flags the moment, and restarts from its own first
              line at &ldquo;an intermediate version&rdquo; of training; the structure is
              theirs, no text is quoted, and where the aha lands on the slider and the chart is an
              illustrative placement: the paper gives the behaviour, not a step number
            </p>
          </div>
        </section>

        <Note kicker="Try it">
          <p>Drag past step {AHA_STEP.toLocaleString()}.</p>
        </Note>

        {/* Step 3 — the give-away */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. Then it was given away
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              Table 5 · ~800K samples · MIT license
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border-l-4 border-grid bg-surface p-4">
            {/*
             * The section's thesis, stated up top with the dot plot as its
             * evidence. It used to be a trailing aside ("page 11's law,
             * compressed into weights") after the reader had stopped looking
             * for one, under an intro paragraph doing five jobs at once.
             */}
            <p className="text-ink">
              Page 13&apos;s two knobs were never equally available. Anyone can pay for thinking
              at answer time; lifting the curve took frontier-scale RL, which meant being a
              frontier lab. Then R1 wrote out <strong>~{P.samplesK}K of its own reasoning
              traces</strong>, six small models were fine-tuned on them, and the behaviour came
              with the text.
              <Cite n={REF.r1} />
            </p>
            <p className="text-ink">
              <strong>The curve-lifting knob got cheap.</strong> Not free: someone still paid for
              the RL once. But they paid once, and the result copies, so the reasoning does not
              have to be re-earned by anyone who wants it. The claim to check on the chart is not
              &ldquo;R1 is good&rdquo;; it is that{" "}
              <strong>a lifted curve fits in weights you can download</strong>. Pick a size:
            </p>

            <figure className="m-0 flex flex-col gap-2">
              <DistillDotPlot picked={pickedSize} onPick={pick} />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <Key shape="circle" className="bg-compute" label="Qwen base" />
                <Key shape="diamond" className="bg-wrong" label="Llama base" />
                <Key shape="circle" className="bg-correct" label="R1 teacher (671B MoE)" />
                <Key shape="dash" className="border-ink-muted" label="closed model (size undisclosed)" />
              </div>
              <figcaption className="text-xs text-ink-muted">
                plain supervised fine-tuning on the traces, no RL and no reward, which is page
                12&apos;s recipe with a far stronger teacher · the released R1 adds a small cold
                start of curated traces before its own RL, and scores {P.r1Aime}% here · rows are
                ordered by size, smallest at the top; the teacher&apos;s {P.teacherParamsB}B is a
                mixture-of-experts total that activates ~{P.teacherActiveB}B per token · GPT-4o
                and o1-mini publish scores but not sizes, so they are rules, not rows
              </figcaption>
            </figure>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a distilled model">
              {DISTILLS.map((d) => {
                const active = d.size === pickedSize;
                return (
                  <button
                    key={d.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => pick(d.size)}
                    className={`rounded border px-3 py-1.5 text-sm ${
                      active
                        ? "border-compute bg-compute/15 font-semibold text-ink"
                        : "border-grid bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <p className="text-sm text-ink">
              <strong>R1-Distill-{picked.label}</strong>{" "}
              <span className="text-ink-muted">· ~{paramRatio}× smaller than its teacher,</span>{" "}
              {picked.note}.
            </p>

            <p className="text-sm text-ink-muted">
              Where a dot lands right of a dashed rule, a model you can download beats a closed
              frontier product by thinking longer at answer time. And page 3 said the stock of
              human text was finite: these traces were not in it. One good reasoner now writes the
              curriculum for everyone else.
            </p>

            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Two pages of frontier claims, and every one of them arrived as a benchmark score:
              71.0% on AIME, level with o1-0912, a 14B crossing o1-mini&apos;s line. Every one of
              them is also a number for thinking longer.{" "}
              <em className="text-ink-muted">
                Next: the side of that dial where thinking longer makes the answer worse.
              </em>
            </div>
          </div>
        </section>

        {/* Simulated vs cited, in the content column rather than across the whole
            page: it qualifies the figures above it, and a line that runs under the
            margin notes reads as a footer for the spread instead. */}
        <div className="flex flex-col gap-1 text-xs text-ink-muted lg:col-start-1">
          <p>
            <strong className="text-ink">Simulated</strong>: the training curve&apos;s intermediate
            points are interpolated along the reported 15.6% → 71.0% climb; the trace skeleton is a
            schematic of the Table 3 trace&apos;s structure, not its text; and where the aha lands
            on the slider is an illustrative placement; the paper gives the behaviour, not a step
            number.
          </p>
          <p>
            <strong className="text-ink">Cited</strong>: every benchmark number is transcribed from
            DeepSeek-AI 2025 (Tables 3 to 5, Figures 2 and 3) and pinned in the test suite.
          </p>
        </div>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
