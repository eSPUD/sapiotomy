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
 *   2. The treadmill. Each benchmark's shelf life from introduction to the
 *      day its bar fell. Framing is verification-corrected: the treadmill
 *      predates reasoning models (GSM8K's bar fell to a non-reasoning model
 *      months before o1 shipped; Dynabench named the pattern in 2021); what
 *      late 2024 collapsed is the holdout tier (GPQA in eleven months, AIME
 *      2024 inside its own calendar year).
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
 * docs/page_15_coordinates_revision.md. The treadmill survives from that
 * revision unchanged; benchmark-scoreboard.json still feeds it.
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

import { useMemo, useState } from "react";
import { Cite, RefItem } from "@/components/Cite";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { SCOREBOARD } from "@/lib/scoreboard";
import { useStore } from "@/store/useStore";

const PAGE_N = 15;
const P = curves.o1Scaling.fit!.params;

/** Page 15's references, numbered in order of first appearance. */
const REF = { openai: 1, deepseek: 2, frontiermath: 3, epoch: 4, gsm8k: 5, math: 6, gpqa: 7, minerva: 8 } as const;

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
  const { xDomain, benchmarks } = SCOREBOARD;

  const [caseKey, setCaseKey] = useState(CASES[0].key);
  /* One guess per case, so revisiting a case keeps its reveal. */
  const [picks, setPicks] = useState<Record<string, CoordKey | "shown">>({});
  const current = CASES.find((c) => c.key === caseKey)!;
  const pick = picks[caseKey];
  const revealed = pick !== undefined;

  const movedText =
    current.moved.length === COORDS.length
      ? "all four coordinates at once"
      : `${coordLabel(current.moved[0])}, and nothing else`;
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
        Pages 13 and 14 argued in benchmark scores, and pages 16 to 20 will ask you to judge fights
        that are fought in them. So learn what a score is first.{" "}
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
                Both headlines are lifted from the cited reports, and both are true.{" "}
                <strong>Which coordinate moved?</strong>
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

        {/* Step 2 — the treadmill */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">
            2. The treadmill
            <span className="ml-2 align-middle text-xs font-normal text-ink-muted">
              every test has a shelf life
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
              Bar = from a benchmark&apos;s introduction to the day its own bar fell. The treadmill
              is older than the reasoners: GSM8K&apos;s bar fell months before the first commercial
              reasoning model shipped.
              <Cite n={REF.gsm8k} /> What late 2024 collapsed is the holdout tier: MATH&apos;s
              gold-medalist line stood almost four years and fell only to o1;
              <Cite n={REF.math} /> GPQA&apos;s PhD bar stood ten months;
              <Cite n={REF.gpqa} /> AIME 2024 fell inside its own calendar year.{" "}
              <strong className="text-ink">The moving goalposts are the system working</strong>: a
              saturated test measures nothing, so retiring it is the honest move.
            </figcaption>
          </figure>
        </section>

        <Note kicker="How to read">
          <p>Read the bars as shelf lives, not scandals.</p>
          <p>A test that everything passes separates nothing; the harder replacement dies faster.</p>
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
        every number on this page is transcribed verbatim from the cited report — announcement
        figures (o3, FrontierMath) are vendor-reported and not peer-reviewed; the coordinate rows
        paraphrase the same reports&apos; own disclosed settings, and the case numbers and treadmill
        spans are pinned in the test suite · ARC-AGI is missing on purpose: its story is the price
        tag, and page 16 tells it with a dollar axis
      </p>

      <PageNav n={PAGE_N} />
    </article>
  );
}
