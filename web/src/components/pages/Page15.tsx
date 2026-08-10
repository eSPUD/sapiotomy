"use client";

/**
 * Page 15, "The Scoreboard: Benchmarks That Track Reasoning" — where Act 3
 * turns from the frontier pair (13-14) to the caveats. Every claim this act
 * makes or weighs ("o1 reasons", "R1 matches it", "the collapse is an
 * artifact") arrives as a benchmark score, so before weighing any of them the
 * reader needs the one intuition headlines strip away: a score is not a
 * property of a model. It is a number plus the conditions it was taken under (model variant,
 * version of the test, harness, thinking budget), and the headline keeps the
 * number while dropping the conditions.
 *
 * THE SPINE (2026-08-09 rework, docs/page_15_visxai_rework.md). The page used to
 * be three lessons that shared a subject: a checklist, a mechanism, a history.
 * It is now one idea with three consequences. A benchmark is an instrument with
 * a window, the window closes three ways (floor, ceiling, familiarity), and
 * keeping it open costs more every time. Section 2 shows the two closers that
 * live on the capability axis and names the third, which does not; section 3
 * prices the climb.
 *
 * Four moves, one per section:
 *   1. The courtroom of headlines. Three real cases, each a pair of
 *      quote-true headlines about the same model on the same test that
 *      disagree wildly (o1's 74.4 vs 93 on AIME, GPT-4o's 12 vs 9.3 on AIME,
 *      o3's 25.2 vs 10 on FrontierMath). The reader guesses which condition
 *      moved, then reveals the two receipts with the moved rows flagged.
 *      Page 13 already teaches WHERE o1's three numbers come from (its
 *      waterfall: chain, vote, re-ranker); this page teaches what their
 *      coexistence does to the word "score". No overlap in lesson.
 *   2. Why tests die. An AUTHORED, illustrative simulation (lib/
 *      benchmarkWindow.ts): a benchmark is an instrument with a window. One
 *      slider moves an abstract frontier past four stylized tests; each
 *      reads floor (everyone fails, no signal) → window (scores spread,
 *      signal) → ceiling (everyone passes, no signal). The treadmill EMERGES
 *      from the mechanics instead of being reported as a status board. This
 *      replaced the earlier lifespan-bars figure, which carried a "still
 *      standing" state that rotted the moment the leaderboard moved (it
 *      claimed FrontierMath stood, which stopped being true); the simulation
 *      makes no claim about where any real benchmark sits today, so it
 *      cannot expire. Real history lives in the caption as immutable facts
 *      (each past ceiling arrived faster than the last; FrontierMath opened
 *      under 2% by design).
 *   3. What the window costs. MEASURED, and no new generation: page 11's run
 *      swept two MATH-500 difficulty bands on one family under identical
 *      settings (greedy, cap 2048, one grader, one seed), and nothing draws the
 *      token counts underneath its FLOPs price. Pairing each model's two greedy
 *      points moves exactly one condition, which problems were asked, and
 *      every model in the family pays roughly twice the tokens for 28 to 34
 *      points less accuracy. That is the price of one harder rung, and a
 *      benchmark ladder is the same move repeated.
 *
 *      Why not the cross-benchmark ladder (MATH-500 to AIME to FrontierMath)
 *      the reader might expect: it moves the prompt, the grader, the answer
 *      format and the item count at once, which is exactly what section 1
 *      spends its length teaching the reader to refuse. The page would break
 *      its own rule two sections after teaching it. lib/page15Price.ts carries
 *      the argument in full, plus why this is not a reprint of page 11.
 *
 *   4. The knob was never new. In 2022 the compute setting traveled inside
 *      the metric's name (Minerva's MATH headline was maj1@64 = 50.3, with
 *      pass@1 = 33.6 in the same table); reasoning models moved it inside
 *      the product and the metric's name stopped carrying it. Close: put the
 *      conditions back, and note the one condition with a meter (the
 *      handoff to page 16's bill).
 *
 * This replaces the earlier score-dashboard revision of this page (a
 * compiled timeline of published dots). That figure was original as a
 * compilation but was a transcription, not an abstraction: its only
 * interaction was reading receipts, which the literature itself already
 * offers. Rationale and the verification behind the reframe:
 * docs/page_15_coordinates_revision.md. benchmark-scoreboard.json no longer
 * feeds this page (it fed the dashboard and the retired lifespan bars); it
 * stays in data/ with its tests for provenance and possible reuse.
 *
 * Data: o1 trio and GPT-4o baseline from data/o1-scaling.json fit params,
 * the same source page 13 prints, so the two pages cannot drift; the other
 * case numbers mirror data/benchmark-scoreboard.json. All numbers verbatim
 * from the cited reports and pinned in the test suite; the condition rows
 * paraphrase the same reports' own disclosed settings.
 *
 * ARC-AGI is deliberately absent: its story is the price tag, and page 16
 * tells it with a dollar axis.
 */

import { useState } from "react";
import { scaleLinear } from "d3";
import { ChartFrame } from "@/components/ChartFrame";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { PAGE15_PRICE } from "@/lib/page15Price";
import {
  CEILING_PCT,
  FLOOR_PCT,
  populationScores,
  windowState,
  WINDOW_TESTS,
} from "@/lib/benchmarkWindow";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;
const P = curves.o1Scaling.fit!.params;

/** Page 15's references, numbered in order of first appearance. */
const REF = {
  openai: 1,
  deepseek: 2,
  frontiermath: 3,
  epoch: 4,
  gsm8k: 5,
  math: 6,
  gpqa: 7,
  snell: 8,
  minerva: 9,
} as const;

/** What each window state means for the reader, spelled out. */
const STATE_CHIP = {
  floor: "no signal: everyone fails",
  window: "signal: it separates the models",
  ceiling: "no signal: everyone passes",
} as const;

/** A margin note that sits beside its step and scrolls with the page. */
function Note({
  kicker,
  bottom = false,
  children,
}: {
  kicker: string;
  /** Sit at the foot of the sidenote column instead of the top of the row. The
   *  house position for a References note beside a final step (page 2's). */
  bottom?: boolean;
  children: React.ReactNode;
}) {
  return (
    <aside
      className={`flex flex-col gap-2 text-sm text-ink-muted ${
        bottom ? "lg:mt-auto lg:self-end" : "lg:pt-9"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

/* ----------------------------- the cases ------------------------------- */

type CoordKey = "model" | "test" | "harness" | "budget";

const COORDS: { key: CoordKey; label: string }[] = [
  { key: "model", label: "the model variant" },
  { key: "test", label: "the version of the test" },
  { key: "harness", label: "whose harness scored it" },
  { key: "budget", label: "the thinking budget" },
];

const coordLabel = (k: CoordKey) => COORDS.find((c) => c.key === k)!.label;

interface HeadlineSide {
  /** Short column tag for the receipt table. */
  tag: string;
  /** The quote-true headline, rendered in quotation marks. */
  quote: string;
  when: string;
  coords: Record<CoordKey, string>;
}

interface HeadlineCase {
  key: string;
  picker: string;
  moved: CoordKey[];
  a: HeadlineSide;
  b: HeadlineSide;
  lesson: React.ReactNode;
}

const CASES: HeadlineCase[] = [
  {
    key: "o1",
    picker: "o1 on AIME 2024",
    moved: ["budget"],
    a: {
      tag: `${P.o1Pass1}%`,
      quote: `o1 scores ${P.o1Pass1}% on AIME 2024`,
      when: "Sep 2024",
      coords: {
        model: "o1",
        test: "AIME 2024, all 15 problems",
        harness: "OpenAI's own evaluation",
        budget: "one chain per problem (pass@1)",
      },
    },
    b: {
      tag: `${P.o1Rerank1000}%`,
      quote: `o1 scores ${P.o1Rerank1000}% on AIME 2024`,
      when: "Sep 2024",
      coords: {
        model: "o1",
        test: "AIME 2024, all 15 problems",
        harness: "OpenAI's own evaluation",
        budget: "1,000 chains per problem, a learned judge picks one (page 8's re-ranker)",
      },
    },
    lesson: (
      <>
        Both numbers sit in a single sentence of the o1 announcement, with {P.o1Cons64}% (page
        7&apos;s vote across 64 chains) between them.
        <Cite n={REF.openai} /> Page 13 built this stack lever by lever; the headline erases which
        lever was on. {(P.o1Rerank1000 - P.o1Pass1).toFixed(1)} points of AIME live in the sampling
        dial alone.
      </>
    ),
  },
  {
    key: "gpt4o",
    picker: "GPT-4o on AIME 2024",
    moved: ["harness"],
    a: {
      tag: `${P.gpt4oAime}%`,
      quote: `GPT-4o scores ${P.gpt4oAime}% on AIME 2024`,
      when: "Sep 2024",
      coords: {
        model: "GPT-4o",
        test: "AIME 2024, all 15 problems",
        harness: "OpenAI's harness, in the o1 announcement",
        budget: "one answer per problem (pass@1)",
      },
    },
    b: {
      tag: "9.3%",
      quote: "GPT-4o scores 9.3% on AIME 2024",
      when: "Jan 2025",
      coords: {
        model: "GPT-4o",
        test: "AIME 2024, all 15 problems",
        harness: "DeepSeek's harness, in the R1 paper",
        budget: "one answer per problem (pass@1)",
      },
    },
    lesson: (
      <>
        Nobody misreported, and the model never changed: prompt format, answer extraction and
        sampling defaults moved the score by nearly a quarter of itself.
        <Cite n={REF.openai} />
        <Cite n={REF.deepseek} /> Compare scores only inside one report.
      </>
    ),
  },
  {
    key: "o3",
    picker: "o3 on FrontierMath",
    moved: ["model", "test", "harness", "budget"],
    a: {
      tag: "25.2%",
      quote: "o3 scores 25.2% on FrontierMath",
      when: "Dec 2024",
      coords: {
        model: "o3, internal pre-release build",
        test: "the 180-problem 2024-11 version",
        harness: "OpenAI, run internally; OpenAI had funded the benchmark, disclosed late",
        budget: "“aggressive test-time compute” (OpenAI's phrase)",
      },
    },
    b: {
      tag: "10%",
      quote: "o3 scores 10% on FrontierMath",
      when: "Apr 2025",
      coords: {
        model: "o3 as released in the product",
        test: "the 290-problem 2025-02 set",
        harness: "Epoch AI, independent",
        budget: "product compute settings",
      },
    },
    lesson: (
      <>
        The dispute that ran through the AI press for a spring, resolved by conditions: every one
        of them moved at once, and the test&apos;s funder was the scorer.
        <Cite n={REF.frontiermath} />
        <Cite n={REF.epoch} /> Neither number is a lie. Without its conditions, neither is a
        measurement.
      </>
    ),
  },
];

/* --------------------------- the price of a rung ------------------------- */

const CHART = { w: 720, h: 400 };
const PRICE_MARGIN = { top: 30, right: 28, bottom: 46, left: 54 };

/**
 * One arrow per model, tail at its easy-band reading and head at its hard-band
 * reading. The geometry is the claim: right means more tokens, down means less
 * accuracy, and all three arrows are near parallel, so the reader sees "every
 * model does the same thing" before reading a single number.
 */
function PriceChart() {
  const { pairs, bands } = PAGE15_PRICE;
  const innerW = CHART.w - PRICE_MARGIN.left - PRICE_MARGIN.right;
  const innerH = CHART.h - PRICE_MARGIN.top - PRICE_MARGIN.bottom;

  const tokens = pairs.flatMap((p) => [p.easy.meanTokens, p.hard.meanTokens]);
  const accs = pairs.flatMap((p) => [p.easy.accuracy, p.hard.accuracy]);
  const x = scaleLinear()
    .domain([Math.min(...tokens) - 60, Math.max(...tokens) + 60])
    .range([0, innerW]);
  const y = scaleLinear()
    .domain([Math.max(0, Math.min(...accs) - 0.1), Math.min(1, Math.max(...accs) + 0.08)])
    .range([innerH, 0]);

  const xTicks = x.ticks(6);
  const yTicks = y.ticks(5);
  const meanEasyX = pairs.reduce((s, p) => s + p.easy.meanTokens, 0) / pairs.length;
  const meanHardX = pairs.reduce((s, p) => s + p.hard.meanTokens, 0) / pairs.length;

  return (
    <ChartFrame
      width={CHART.w}
      height={CHART.h}
      margin={PRICE_MARGIN}
      xLabel="mean tokens generated per problem (the meter reading)"
      yLabel="accuracy"
      title={
        `Accuracy against tokens spent per problem, for three models on two MATH-500 ` +
        `difficulty bands. Every model moves right and down going from the easy band to ` +
        `the hard band: ${pairs
          .map(
            (p) =>
              `${p.label} spends ${Math.round(p.easy.meanTokens)} tokens at ${Math.round(
                p.easy.accuracy * 100,
              )}% on the easy band and ${Math.round(p.hard.meanTokens)} tokens at ${Math.round(
                p.hard.accuracy * 100,
              )}% on the hard band`,
          )
          .join("; ")}.`
      }
    >
      <defs>
        <marker
          id="p15-arrow"
          viewBox="0 0 10 10"
          refX={8}
          refY={5}
          markerWidth={7}
          markerHeight={7}
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" className="fill-compute" />
        </marker>
      </defs>

      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={0} x2={innerW} y1={y(t)} y2={y(t)} className="stroke-grid" strokeWidth={0.5} />
          <text x={-8} y={y(t)} dy={4} textAnchor="end" className="fill-ink-muted text-[11px]">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text
          key={`x${t}`}
          x={x(t)}
          y={innerH + 16}
          textAnchor="middle"
          className="fill-ink-muted text-[11px]"
        >
          {t}
        </text>
      ))}

      {/* Which end of the plot is which band, said on the plot itself. */}
      <text x={x(meanEasyX)} y={-10} textAnchor="middle" className="fill-ink-muted text-[11px]">
        MATH-500 {bands.easy.levels}
      </text>
      <text x={x(meanHardX)} y={-10} textAnchor="middle" className="fill-ink-muted text-[11px]">
        MATH-500 {bands.hard.levels}
      </text>

      {pairs.map((p) => (
        <g key={p.label}>
          <line
            x1={x(p.easy.meanTokens)}
            y1={y(p.easy.accuracy)}
            x2={x(p.hard.meanTokens)}
            y2={y(p.hard.accuracy)}
            className="stroke-compute"
            strokeWidth={2}
            markerEnd="url(#p15-arrow)"
          />
          <circle
            cx={x(p.easy.meanTokens)}
            cy={y(p.easy.accuracy)}
            r={5}
            className="fill-canvas stroke-compute"
            strokeWidth={2}
          />
          <text
            x={x(p.easy.meanTokens)}
            y={y(p.easy.accuracy) - 12}
            textAnchor="middle"
            className="fill-ink text-[12px] font-semibold"
          >
            {p.label}
          </text>
        </g>
      ))}
    </ChartFrame>
  );
}

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [caseKey, setCaseKey] = useState(CASES[0].key);
  /* One guess per case, so revisiting a case keeps its reveal. */
  const [picks, setPicks] = useState<Record<string, CoordKey | "shown">>({});
  const current = CASES.find((c) => c.key === caseKey)!;
  const pick = picks[caseKey];
  const revealed = pick !== undefined;

  /* "and nothing else" would be an assertion about every condition the two
     reports did not print. For the GPT-4o pair in particular, nobody here has
     opened the R1 paper's eval appendix to confirm DeepSeek scored the same
     15-problem AIME 2024 set OpenAI did, and if it did not, the taught answer
     is wrong. "as far as either report says" is what the page can support. */
  const movedText =
    current.moved.length === COORDS.length
      ? "all four conditions at once"
      : `${coordLabel(current.moved[0])}, as far as either report says`;
  const verdictPrefix =
    pick === undefined || pick === "shown"
      ? ""
      : current.moved.includes(pick)
        ? "Good guess. "
        : `Not quite: ${coordLabel(pick)} is the same in both headlines. `;

  const guess = (k: CoordKey | "shown") => {
    setPicks((p) => ({ ...p, [caseKey]: k }));
    recordInteraction(PAGE_N);
  };

  /* Section 2: the frontier's position in illustrative units, default mid-ladder. */
  const [capability, setCapability] = useState(4.5);
  const rows = WINDOW_TESTS.map((t) => {
    const scores = populationScores(capability, t.difficulty);
    return { ...t, scores, state: windowState(scores) };
  });
  const readable = rows.filter((r) => r.state === "window").length;
  const allBlind = rows.every((r) => r.state === "ceiling");

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
        The same model, the same test, the same month. 74.4% vs 93%, and both are true. What
        gives?{" "}
        <strong className="text-ink">A score is not a property of a model</strong>; it is a number
        plus the conditions it was taken under, and headlines like to print the number alone.
      </p>

      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 — the courtroom of headlines */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            1. Two true headlines, one model
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              published numbers · no simulation
            </span>
          </h2>

          <div className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Pick a case">
              {CASES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  aria-pressed={caseKey === c.key}
                  onClick={() => {
                    setCaseKey(c.key);
                    recordInteraction(PAGE_N);
                  }}
                  className={`rounded px-3 py-1.5 text-sm ${
                    caseKey === c.key
                      ? "bg-compute text-canvas"
                      : "border border-grid bg-surface-raised text-ink-muted"
                  }`}
                >
                  {c.picker}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[current.a, current.b].map((side) => (
                <figure
                  key={side.tag}
                  className="m-0 flex flex-col gap-2 rounded-lg border border-grid bg-surface-raised p-4"
                >
                  <blockquote className="m-0 text-lg font-semibold leading-snug text-ink">
                    &ldquo;{side.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-2 text-xs text-ink-muted">
                    <span className="rounded border border-grid px-1.5 py-0.5 font-semibold">
                      quote-true
                    </span>
                    {side.when}
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-ink">
                Both headlines are true, and both are badged{" "}
                <span className="rounded border border-grid px-1 py-0.5 text-xs font-semibold">
                  quote-true
                </span>
                , which on this page means every number in them is lifted verbatim from the cited
                report. The sentence around the number is ours, written the way a headline would
                carry it. <strong>Which condition moved?</strong>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Which condition moved?">
                {COORDS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    disabled={revealed}
                    onClick={() => guess(c.key)}
                    className={`rounded border px-3 py-1.5 text-sm disabled:opacity-60 ${
                      revealed && current.moved.includes(c.key)
                        ? "border-compute bg-compute/15 font-semibold text-ink"
                        : "border-grid bg-surface-raised text-ink-muted"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                {!revealed ? (
                  <button
                    type="button"
                    onClick={() => guess("shown")}
                    className="rounded px-3 py-1.5 text-sm text-ink-muted underline decoration-dotted"
                  >
                    just show me
                  </button>
                ) : null}
              </div>
            </div>

            <div aria-live="polite" className="flex flex-col gap-3">
              {revealed ? (
                <>
                  <p className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
                    {verdictPrefix}
                    What moved: <strong>{movedText}</strong>.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                          <th scope="col" className="py-1.5 pr-3 font-semibold">
                            condition
                          </th>
                          <th scope="col" className="py-1.5 pr-3 font-semibold">
                            the {current.a.tag} headline
                          </th>
                          <th scope="col" className="py-1.5 font-semibold">
                            the {current.b.tag} headline
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {COORDS.map((c) => {
                          const moved = current.moved.includes(c.key);
                          return (
                            <tr
                              key={c.key}
                              className={`border-t border-grid align-top ${moved ? "bg-compute/10" : ""}`}
                            >
                              <th
                                scope="row"
                                className={`py-2 pr-3 text-left font-medium ${moved ? "text-ink" : "text-ink-muted"}`}
                              >
                                {moved ? "≠ " : ""}
                                {c.label}
                              </th>
                              <td className={`py-2 pr-3 ${moved ? "text-ink" : "text-ink-muted"}`}>
                                {current.a.coords[c.key]}
                              </td>
                              <td className={`py-2 ${moved ? "text-ink" : "text-ink-muted"}`}>
                                {current.b.coords[c.key]}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-sm text-ink">{current.lesson}</p>
                  <p className="rounded-lg border-l-4 border-compute bg-compute/10 p-3 text-sm text-ink">
                    <strong>Watch the second condition.</strong> A different version of a test is
                    not just a different set of questions. A version published after a model
                    trained is a different test entirely, and section 2 is about what that does.
                  </p>
                </>
              ) : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6 lg:gap-0">
          <Note kicker="The rule">
            <p>Guess before you reveal.</p>
            <p>
              All six headlines on this page are quote-true. That is the problem: a number with
              its conditions filed off can say almost anything.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.openai} href="https://openai.com/index/learning-to-reason-with-llms/" preprint>
              OpenAI 2024, the o1 and o3 announcements.
            </RefItem>
            <RefItem n={REF.deepseek} href="https://arxiv.org/abs/2501.12948">
              DeepSeek-AI 2025.
            </RefItem>
            <RefItem n={REF.frontiermath} href="https://arxiv.org/abs/2411.04872" preprint>
              Glazer et al. 2024, <em>FrontierMath</em>.
            </RefItem>
            <RefItem n={REF.epoch}>
              Epoch AI and TechCrunch 2025, on the FrontierMath dispute.
            </RefItem>
          </Note>
        </div>

        {/* Step 2 — why tests die (authored simulation) */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. Why tests die
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              authored simulation · no real benchmark&apos;s numbers
            </span>
          </h2>
          <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              A test is only useful while it can tell the models apart. Too hard and everyone
              fails it, too easy and everyone passes it, and either way the scoreboard stops
              telling you anything. Drag the slider to make the models better, and watch four
              tests go from too hard, to useful, to too easy.
            </p>
            <p className="text-sm text-ink">
              There are <strong>three ways</strong> a test stops being useful, and two of them are
              on this slider: everyone fails, or everyone passes. The third has nothing to do with
              how good the models are, so no amount of dragging will show it. That one is below
              the figure.
            </p>
            <p className="text-sm text-ink-muted">
              {/* 15.5: the axis had no referent at all, and "where are we today?"
                  is the first thing a reader asks a capability slider. Any dated
                  answer rots inside a year, so the anchor is ordinal and reads
                  off the rows themselves. */}
              Do not look for today&apos;s position on this slider. There is no honest place to
              mark it, and any mark would be wrong within a year. Read it as an order instead:{" "}
              <strong className="text-ink">today is always wherever the newest test still
              works</strong>, and everything above it has already been passed.
            </p>

            <Slider
              label="frontier capability (ordinal, not calibrated to any date)"
              min={0}
              max={12}
              step={0.25}
              value={capability}
              format={(v) => v.toFixed(2).replace(/\.?0+$/, "")}
              onChange={(v) => {
                setCapability(v);
                recordInteraction(PAGE_N);
              }}
            />

            <div className="flex flex-col gap-3">
              {rows.map((r) => {
                const inWindow = r.state === "window";
                const lo = Math.round(Math.min(...r.scores));
                const hi = Math.round(Math.max(...r.scores));
                return (
                  <div key={r.key} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span className={inWindow ? "font-medium text-ink" : "text-ink-muted"}>
                        {r.label}
                      </span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-xs ${
                          inWindow
                            ? "border-compute bg-compute/15 font-semibold text-ink"
                            : "border-grid text-ink-muted"
                        }`}
                      >
                        {STATE_CHIP[r.state]}
                      </span>
                    </div>
                    <div
                      role="img"
                      aria-label={`${r.label}: ${STATE_CHIP[r.state]}; the five models score between ${lo}% and ${hi}%.`}
                      className="relative h-5 rounded-sm border border-grid bg-canvas"
                    >
                      {/* the two no-signal edges */}
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 border-r border-dashed border-grid"
                        style={{ left: `${FLOOR_PCT}%` }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 border-l border-dashed border-grid"
                        style={{ left: `${CEILING_PCT}%` }}
                      />
                      {r.scores.map((s, i) => (
                        <div
                          key={i}
                          aria-hidden="true"
                          className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                            inWindow ? "bg-compute" : "bg-grid"
                          }`}
                          style={{ left: `${s}%` }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <p aria-live="polite" className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              {allBlind ? (
                <>
                  <strong>Every test here is now too easy.</strong> The scoreboard reads 100
                  across the board and tells you nothing. The only fix is a harder test, which is
                  why <strong>moving the goalposts is the system working.</strong>
                </>
              ) : (
                <>
                  Tests still telling these models apart:{" "}
                  <strong>{readable} of {rows.length}</strong>. A score only means something while
                  its test is one of those.
                </>
              )}
            </p>

            <figcaption className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
              The four tests above are invented, and their difficulties are chosen to teach. What
              is not invented is the pattern. Grade-school word problems, competition maths, and a
              set of questions written to be hard for PhDs have all made this trip, from nobody
              can pass it to everybody can, and each one made it faster than the test before.
              <Cite n={REF.gsm8k} />
              <Cite n={REF.math} />
              <Cite n={REF.gpqa} /> New tests are built to be nearly impossible on purpose:
              FrontierMath launched with every model on earth scoring under 2%.
              <Cite n={REF.frontiermath} />
            </figcaption>
          </figure>

          <p className="text-ink">
            <strong className="text-ink">The third way is different.</strong> A test written
            before a model was trained is a test the model may already have read. Nothing on that
            slider will reveal it: a test can look perfectly useful up there and still be
            rewarding memory instead of reasoning. Page 17 puts a number on it, on an exam
            released after these models finished training.
          </p>
          <p className="text-ink">
            And it reaches us. The hundred problems under Act 2, and under the next section, come
            from a set published in 2021, which is inside the training data of every model in this
            deck. We cannot tell you how much that flatters our own numbers either.
          </p>
        </section>

        <div className="flex flex-col gap-6 lg:gap-0">
          <Note kicker="How to read">
            <p>Drag the slider; watch which tests still tell the models apart.</p>
            <p>
              A test going out of use because everyone passes it is a success, not a scandal. The
              four here are invented, and say nothing about where any real test sits today.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.gsm8k} href="https://arxiv.org/abs/2110.14168">
              Cobbe et al. 2021, <em>GSM8K</em>.
            </RefItem>
            <RefItem n={REF.math} href="https://arxiv.org/abs/2103.03874">
              Hendrycks et al. 2021, <em>MATH</em>.
            </RefItem>
            <RefItem n={REF.gpqa} href="https://arxiv.org/abs/2311.12022">
              Rein et al. 2023, <em>GPQA</em>.
            </RefItem>
          </Note>
        </div>

        {/* Step 3 — what the window costs (measured, page 11's run) */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            3. What the window costs
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              measured · our own run · no new generation
            </span>
          </h2>
          <figure className="m-0 flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4">
            <p className="text-sm text-ink">
              A harder question does not just get answered wrong more often.{" "}
              <strong>It gets answered at greater length</strong>: more thinking spent, less
              accuracy returned. It is why the right amount of thinking to buy depends on the
              question you are buying it for.
              <Cite n={REF.snell} /> Here is one step of that, measured: the same three models
              asked the easy half of MATH-500, then the hard half, with only the problems changed.
            </p>

            <PriceChart />

            <div className="flex flex-col gap-1 border-t border-dashed border-grid pt-2">
              {PAGE15_PRICE.pairs.map((p) => (
                <p key={p.label} className="text-sm text-ink-muted">
                  <strong className="text-ink">{p.label}</strong> pays{" "}
                  <strong className="text-ink">{p.tokenRatio.toFixed(1)}x</strong> the tokens on
                  the hard band and scores{" "}
                  <strong className="text-ink">{Math.round(p.accuracyDropPts)} points</strong>{" "}
                  lower.
                </p>
              ))}
            </div>

            <p className="rounded-lg border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              Every model in the family does the same thing: <strong>roughly twice the thinking
              for roughly thirty points less accuracy</strong>. That is the toll for one rung. A
              benchmark ladder is this move repeated for a decade, which is why the tests that can
              still see the frontier are the expensive ones, and why the meter on the next page
              runs faster every year.
            </p>

            <figcaption className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
              Act 2 sold you this trade running the other way: spend more tokens, buy more
              accuracy. The arrows are what happens when the question gets harder instead. The
              model spends the tokens anyway and does not get the accuracy, so{" "}
              <strong className="text-ink">difficulty charges you twice</strong>, once in what an
              attempt costs and once in what it fails to buy. Page 11&apos;s measured run,
              replayed here rather than generated again: greedy, cap 2,048 tokens, one grader,
              one family.
            </figcaption>
          </figure>
        </section>

        <div className="flex flex-col gap-6 lg:gap-0">
          <Note kicker="The move">
            <p>Follow one arrow from its hollow tail to its head.</p>
            <p>
              Right is more thinking bought; down is less accuracy returned. Three models, three
              arrows, one direction.
            </p>
          </Note>
          <Note kicker="Limits">
            <p>
              This is one step in difficulty, not a whole ladder; reading the frontier off it is
              extrapolation. The two halves were run separately rather than in one execution, and
              the easy half has {PAGE15_PRICE.bands.easy.n} problems against the hard half&apos;s{" "}
              {PAGE15_PRICE.bands.hard.n}. A fourth model in the run, a maths specialist, was
              measured on the easy half only and is left out rather than drawn with a hole.
            </p>
          </Note>
          <Note kicker="References">
            <RefItem n={REF.snell} href="https://arxiv.org/abs/2408.03314">
              Snell et al. 2024, <em>Scaling LLM Test-Time Compute Optimally</em>, ICLR 2025: the
              compute worth spending depends on the question&apos;s difficulty.
            </RefItem>
          </Note>
        </div>

        {/* Step 4 — the knob was never new */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">4. Put the conditions back</h2>
          <p className="text-ink">
            <strong className="text-ink">The thinking budget used to travel with the score.</strong>{" "}
            In 2022 it was written into the metric&apos;s own name. Minerva&apos;s celebrated MATH
            result was <code className="rounded bg-surface-raised px-1 text-[13px]">maj1@64 = 50.3%</code>,
            and the name says what it is: a majority vote over 64 tries. The single-try{" "}
            <code className="rounded bg-surface-raised px-1 text-[13px]">pass@1 = 33.6%</code> sat
            in the same table, sixteen points below.
            <Cite n={REF.minerva} /> You could not quote the good number without also quoting how
            much thinking bought it.
          </p>
          <p className="text-ink">
            <strong className="text-ink">Reasoning models moved it inside the product.</strong> An
            effort setting, a token allowance, a hidden chain.
            <Cite n={REF.openai} /> The metric&apos;s name stopped carrying any of it, so the
            setting moved into the fine print, and fine print rarely survives being retold. The
            number alone always does.
          </p>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            So a score is a reading, not a property. When the next one lands, ask five questions.
            Four of them locate the reading: which model variant, which version of the test, whose
            harness, how much thinking. The fifth asks whether the instrument could see anything
            at all: was this test published before the model trained?{" "}
            <em className="text-ink-muted">
              Only one of the five has a meter running, and section 3 just watched it climb: a
              harder rung cost every model in our family about twice the thinking. Next: the bill.
              Turn the page.
            </em>
          </div>
        </section>

        <Note kicker="References">
          <RefItem n={REF.minerva} href="https://arxiv.org/abs/2206.14858">
            Lewkowycz et al. 2022, <em>Minerva</em>.
          </RefItem>
        </Note>
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
