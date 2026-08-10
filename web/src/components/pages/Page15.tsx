"use client";

/**
 * Page 15, "The Scoreboard: Benchmarks That Track Reasoning" — where Act 3
 * turns from the frontier pair (13-14) to the caveats. Every claim this act
 * makes or weighs ("o1 reasons", "R1 matches it", "the collapse is an
 * artifact") arrives as a benchmark score, so before weighing any of them the
 * reader needs the one intuition headlines strip away: a score is not a
 * property of a model. It is a point with four coordinates (model variant,
 * version of the test, harness, thinking budget), and the headline keeps the
 * number while dropping the coordinates.
 *
 * Three moves, one per section:
 *   1. The courtroom of headlines. Three real cases, each a pair of
 *      quote-true headlines about the same model on the same test that
 *      disagree wildly (o1's 74.4 vs 93 on AIME, GPT-4o's 12 vs 9.3 on AIME,
 *      o3's 25.2 vs 10 on FrontierMath). The reader guesses which coordinate
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
 *   3. The knob was never new. In 2022 the compute setting traveled inside
 *      the metric's name (Minerva's MATH headline was maj1@64 = 50.3, with
 *      pass@1 = 33.6 in the same table); reasoning models moved it inside
 *      the product and the metric's name stopped carrying it. Close: put the
 *      coordinates back, and note the one coordinate with a meter (the
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
 * from the cited reports and pinned in the test suite; the coordinate rows
 * paraphrase the same reports' own disclosed settings.
 *
 * ARC-AGI is deliberately absent: its story is the price tag, and page 16
 * tells it with a dollar axis.
 */

import { useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
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
const REF = { openai: 1, deepseek: 2, frontiermath: 3, epoch: 4, gsm8k: 5, math: 6, gpqa: 7, minerva: 8 } as const;

/** What each window state means for the reader, spelled out. */
const STATE_CHIP = {
  floor: "no signal: everyone fails",
  window: "signal: it separates the models",
  ceiling: "no signal: everyone passes",
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
        The dispute that ran through the AI press for a spring, resolved by coordinates: every one
        of them moved at once, and the test&apos;s funder was the scorer.
        <Cite n={REF.frontiermath} />
        <Cite n={REF.epoch} /> Neither number is a lie. Without its coordinates, neither is a
        measurement.
      </>
    ),
  },
];

export function Page15() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [caseKey, setCaseKey] = useState(CASES[0].key);
  /* One guess per case, so revisiting a case keeps its reveal. */
  const [picks, setPicks] = useState<Record<string, CoordKey | "shown">>({});
  const current = CASES.find((c) => c.key === caseKey)!;
  const pick = picks[caseKey];
  const revealed = pick !== undefined;

  /* "and nothing else" would be an assertion about every coordinate the two
     reports did not print. For the GPT-4o pair in particular, nobody here has
     opened the R1 paper's eval appendix to confirm DeepSeek scored the same
     15-problem AIME 2024 set OpenAI did, and if it did not, the taught answer
     is wrong. "as far as either report says" is what the page can support. */
  const movedText =
    current.moved.length === COORDS.length
      ? "all four coordinates at once"
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
        Pages 13 and 14 argued in benchmark scores, and the four pages left will spend them: 16
        bills you for them, 17 shows you where they came from, and the last two ask what a score
        was ever evidence of. So learn what a score is first.{" "}
        <strong className="text-ink">A score is not a property of a model.</strong> It is a point
        with <strong className="text-ink">four coordinates</strong>: which model variant, which
        version of the test, whose harness scored it, and how much thinking was bought. A headline
        keeps the number and drops the coordinates. This page is where you learn to put them back.
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
                carry it. <strong>Which coordinate moved?</strong>
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Which coordinate moved?">
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
                            coordinate
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
                </>
              ) : null}
            </div>
          </div>
        </section>

        <Note kicker="The rule">
          <p>Guess before you reveal.</p>
          <p>
            All six headlines on this page are quote-true. That is the problem: a number with its
            coordinates filed off can say almost anything.
          </p>
        </Note>

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
              A benchmark is a measuring instrument, and an instrument has a{" "}
              <strong>window</strong>. Slide the frontier past four stylized tests and read each
              one&apos;s verdict: below its window every model fails (no signal), inside it the
              same five models spread out (signal), past it everyone passes (no signal again).
            </p>
            <p className="text-sm text-ink-muted">
              {/* 15.5: the axis had no referent at all, and "where are we today?"
                  is the first thing a reader asks a capability slider. Any dated
                  answer rots inside a year, so the anchor is ordinal and reads
                  off the rows themselves. */}
              Do not look for today&apos;s position on this axis; there is no honest one to mark,
              and any number written here would be wrong within a year. Read it as an ordering
              instead. <strong className="text-ink">Today is always wherever the newest test
              still has a spread</strong>, and the tests above it have already gone blind.
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
                  <strong>Every test here has gone blind.</strong> The scoreboard now reads
                  100 across the board and says nothing. The only fix is a harder test:{" "}
                  <strong>moving the goalposts is the system working.</strong>
                </>
              ) : (
                <>
                  Tests that can currently see the frontier: <strong>{readable} of {rows.length}</strong>.
                  A score only means something while its test is in the window.
                </>
              )}
            </p>

            <figcaption className="border-t border-dashed border-grid pt-2 text-sm text-ink-muted">
              The tests above are stylized; difficulties and spreads are authored for teaching. The
              structure is the history, though: GSM8K, MATH&apos;s gold-medalist line, GPQA&apos;s
              PhD bar and AIME 2024 each rode this arc from floor to ceiling, each ceiling arriving
              faster than the last, GSM8K&apos;s before the first commercial reasoning model
              shipped.
              <Cite n={REF.gsm8k} />
              <Cite n={REF.math} />
              <Cite n={REF.gpqa} /> And new tests are born at the floor on purpose: FrontierMath
              opened with every frontier model under 2%.
              <Cite n={REF.frontiermath} /> A test at either edge of its window measures nothing,
              so <strong className="text-ink">the moving goalposts are the system working</strong>:
              retiring a blind test is the honest move.
            </figcaption>
            <p className="rounded border-l-4 border-compute bg-surface-raised p-3 text-sm text-ink">
              There is a second way a test loses its window, and it does not need the frontier to
              move at all. A benchmark published before the models trained is a benchmark the
              models may have read.{" "}
              <strong>Page 17 puts a number on that</strong>: on AIME 2025, released after these
              models trained, reasoning models scored well below their averages on the older
              years. A test can be inside its window on this figure and still be measuring
              familiarity.
            </p>
          </figure>
        </section>

        <Note kicker="How to read">
          <p>Slide the frontier; watch which tests can still see it.</p>
          <p>
            A benchmark measures only while the frontier is inside its window. Death by ceiling is
            success, and it says nothing about where any real test sits the day you read this.
          </p>
        </Note>

        {/* Step 3 — the knob was never new */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. Put the coordinates back</h2>
          <p className="text-ink-muted">
            The thinking-budget coordinate is not new; what changed is where it hides.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border-l-4 border-grid bg-surface p-4 text-sm text-ink">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                2022: the knob in the metric&apos;s name
              </p>
              <p className="mt-2">
                Minerva&apos;s celebrated MATH score was written{" "}
                <code className="rounded bg-surface-raised px-1 font-mono text-[13px]">
                  maj1@64 = 50.3%
                </code>
                : majority vote over 64 samples, says the name. The single-try{" "}
                <code className="rounded bg-surface-raised px-1 font-mono text-[13px]">
                  pass@1 = 33.6%
                </code>{" "}
                sat in the same table.
                <Cite n={REF.minerva} /> The number and its budget traveled together.
              </p>
            </div>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-sm text-ink">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                2024 on: the knob in the product
              </p>
              <p className="mt-2">
                Reasoning models moved the budget inside: an effort setting, a token allowance, a
                hidden chain.
                <Cite n={REF.openai} /> The metric&apos;s name stopped carrying it, so the setting
                lives in the fine print. Fine print rarely survives retelling; the number alone
                always does.
              </p>
            </div>
          </div>
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            So a score is a reading, not a property. When the next one lands, put the coordinates
            back: which model variant, which version of the test, whose harness, how much thinking.{" "}
            <em className="text-ink-muted">
              Only one of the four has a meter running: thinking is billed by the token. Next: the
              bill. Turn the page.
            </em>
          </div>
        </section>

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
          <RefItem n={REF.gsm8k} href="https://arxiv.org/abs/2110.14168">
            Cobbe et al. 2021, <em>GSM8K</em>.
          </RefItem>
          <RefItem n={REF.math} href="https://arxiv.org/abs/2103.03874">
            Hendrycks et al. 2021, <em>MATH</em>.
          </RefItem>
          <RefItem n={REF.gpqa} href="https://arxiv.org/abs/2311.12022">
            Rein et al. 2023, <em>GPQA</em>.
          </RefItem>
          <RefItem n={REF.minerva} href="https://arxiv.org/abs/2206.14858">
            Lewkowycz et al. 2022, <em>Minerva</em>.
          </RefItem>
        </Note>
      </div>

      <p className="text-xs text-ink-muted">
        every real number on this page is transcribed verbatim from the cited report, and the
        headline sentence carrying it is written for this page · announcement figures (o3,
        FrontierMath) are vendor-reported and not peer-reviewed; the coordinate rows
        paraphrase the same reports&apos; own disclosed settings, and the case numbers are pinned in
        the test suite · section 2 is an authored simulation (no real benchmark&apos;s numbers),
        its shape pinned in the test suite · ARC-AGI is missing on purpose: its story is the price
        tag, and page 16 tells it with a dollar axis
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
