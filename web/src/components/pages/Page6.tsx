"use client";

/**
 * Page 6, "Thinking Longer" — the deck's first naming of inference-time
 * compute. Page 5 showed the road (a chain on the page); this page puts a
 * meter on it: every unit of working written before committing is computation
 * spent, so a budget on that working directly sets the bar for how long the
 * model may think. The interactive is an authored five-step chain
 * (lib/authored THINK_BUDGET, 47 x 63 - 29 x 41 = 1,772): drag the budget from
 * 0 to the cap and watch the answer flip wrong -> right while a "serial
 * computation depth" meter fills. System 1 vs System 2 carries over from Act 1:
 * blurting takes no time; showing your work takes focus and time — for a model,
 * that focus-and-time currency IS tokens. The measured version of the trade is
 * the cited s1 result (budget forcing, 50% -> 57% on AIME24), teased here and
 * treated fully on page 15.
 *
 * UNITS (load-bearing): the meter counts WORDS, not tokenizer tokens. The
 * authored costs are whitespace word counts and nothing on this page may label
 * them "tokens" — a real token count is model-specific and has to be measured
 * (for Claude, /v1/messages/count_tokens). "Token" stays in the prose as the
 * concept; every NUMBER on screen is a word count, and the chip says so.
 * See lib/authored THINK_BUDGET for the full units note.
 *
 * Layout: shell matches pages 1, 3 and 5 — one numbered reading column
 * (1. spend it · 2. what it bought · 3. measured for real) beside a sticky
 * instructions/references rail. The earlier build boxed the live demo into the
 * left half and stacked four static prose cards on the right, so the reader
 * ping-ponged between a control and commentary; the numbered stack is one read.
 *
 * The demonstration is authored and flagged; no live model. Theory grounding
 * cited in the footer: Kojima et al. 2022 (zero-shot "Let's think step by
 * step"), Feng et al. 2023 and Merrill & Sabharwal 2024 (chain length
 * extends the serial computation a transformer can perform).
 */

import { useRef, useState } from "react";
import { CitationBadge } from "@/components/CitationBadge";
import { LineChart } from "@/components/LineChart";
import { PageNav } from "@/components/PageNav";
import { Slider } from "@/components/Slider";
import { THINK_BUDGET } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { curves } from "@/lib/curves";
import { useStore } from "@/store/useStore";

const PAGE_N = 6;
const T = THINK_BUDGET;
/** Total working the full chain costs, in WORDS (not tokenizer tokens). */
const WORD_CAP = T.steps.reduce((n, s) => n + s.words, 0);

export function Page6() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const bf = curves.budgetForcing;
  const bp = bf.fit!.params;

  const [budget, setBudget] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const touchedRef = useRef(false);
  const landedRef = useRef(false);

  // Step 3 — the measured "Wait" dial (real s1-32B / AIME24 numbers).
  const pts = bf.points; // x = number of "Wait" appends, y = accuracy %
  const WAIT_MAX = pts.length - 1;
  const flipAt = bp.flipAtPress; // a representative problem flips wrong->right here
  const [appends, setAppends] = useState(0);
  const acc = pts[appends].y;
  const solved = appends >= flipAt;
  const waitLandedRef = useRef(false);

  const onWait = (n: number) => {
    recordInteraction(PAGE_N);
    const clamped = Math.max(0, Math.min(WAIT_MAX, n));
    setAppends(clamped);
    if (clamped >= flipAt && !waitLandedRef.current) {
      waitLandedRef.current = true;
      setAnnouncement(
        `After ${clamped} "Wait" appends, AIME24 accuracy reaches ${pts[clamped].y}% and the representative problem flips to solved.`,
      );
    } else if (clamped === 0) {
      waitLandedRef.current = false;
      setAnnouncement(`Zero "Wait" appends: baseline AIME24 accuracy ${pts[0].y}%.`);
    }
  };

  // Steps afford in order; a step runs only if its whole cost fits.
  let spent = 0;
  let depth = 0;
  for (const s of T.steps) {
    if (spent + s.words <= budget) {
      spent += s.words;
      depth += 1;
    } else {
      break;
    }
  }
  const done = depth >= T.steps.length;

  const onBudget = (v: number) => {
    if (!touchedRef.current) {
      touchedRef.current = true;
      recordInteraction(PAGE_N);
    }
    setBudget(v);
    if (!landedRef.current && v >= WORD_CAP) {
      landedRef.current = true;
      setAnnouncement(
        `Budget ${WORD_CAP} words: the chain completes at depth ${T.steps.length} and the answer flips to ${T.display} (correct).`,
      );
    } else if (v === 0) {
      setAnnouncement(`Budget zero: the model blurts ${T.blurt} (wrong).`);
    }
  };

  return (
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>

      {/* Left = the numbered walk-through · Right = instructions + references */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* LEFT COLUMN */}
        <div className="flex min-w-0 flex-col gap-8">
          <p className="text-lg text-ink-muted">
            A chain is written one piece at a time, and{" "}
            <strong className="text-ink">every piece of it is computation</strong> the model spends
            before committing. So the dial is blunt and direct: cap the working and you have set
            the bar for how long the model may think. More working, more serial computation, and a
            higher chance the answer lands.
          </p>

          {/* Step 1 — the interactive */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              1. Spend the budget
              <span className="ml-2 align-middle text-sm font-normal text-ink-muted">
                one hard product · a budget on its thinking
              </span>
            </h2>
            <section
              aria-label="The compute-budget demo"
              className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4"
            >
              <p className="text-lg text-ink">{T.question}</p>

              <Slider
                label="Working budget"
                min={0}
                max={WORD_CAP}
                value={budget}
                onChange={onBudget}
                suffix=" words"
              />

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase tracking-wide text-ink-muted">
                  serial computation depth
                </p>
                <div className="flex items-center gap-1" aria-hidden="true">
                  {T.steps.map((s, i) => (
                    <span
                      key={i}
                      className={`h-3 w-7 rounded-sm ${i < depth ? "bg-compute" : "border border-grid bg-surface-raised"}`}
                    />
                  ))}
                </div>
                <p className="font-mono text-sm tabular-nums text-ink">
                  depth {depth} of {T.steps.length}
                </p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  {spent} of {WORD_CAP} words spent
                </p>
              </div>

              <ol className="flex flex-col gap-1.5 border-t border-dashed border-grid pt-3">
                {T.steps.map((s, i) => {
                  const afforded = i < depth;
                  return (
                    <li
                      key={i}
                      className={`flex items-baseline gap-2 text-sm ${afforded ? "text-ink" : "text-ink-muted"}`}
                    >
                      <span className="font-mono text-xs text-compute">{i + 1}</span>
                      <span className="flex-1">{afforded ? s.text : "· · · (not yet afforded)"}</span>
                      <span className="font-mono text-xs tabular-nums text-ink-muted">
                        {s.words} words
                      </span>
                    </li>
                  );
                })}
              </ol>

              {done ? (
                <div className="rounded-lg border-l-4 border-correct bg-correct/15 p-3">
                  <p className="text-ink">
                    <span className="font-semibold text-correct">✓ {T.display}.</span>{" "}
                    <span className="text-sm text-ink-muted">
                      The full chain fit the budget: five dependent steps, each conditioning on the
                      last, landed the answer.
                    </span>
                  </p>
                </div>
              ) : depth === 0 ? (
                <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                  <p className="text-ink">
                    <span className="font-semibold text-wrong">✗ {T.blurt}.</span>{" "}
                    <span className="text-sm text-ink-muted">
                      Zero budget is System 1: one forward leap, a confident near-miss (a borrow
                      slipped in the subtraction it never wrote down).
                    </span>
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                  <p className="text-ink">
                    <span className="font-semibold text-wrong">✗ out of budget mid-chain.</span>{" "}
                    <span className="text-sm text-ink-muted">
                      The chain was cut after step {depth}; forced to commit early, the model&apos;s
                      guess is no better than the blurt: {T.blurt}.
                    </span>
                  </p>
                </div>
              )}

              {/* Units, stated where the numbers are — not buried in the footer. */}
              <p className="border-t border-grid pt-3 text-sm text-ink-muted">
                <strong className="text-ink">What the meter counts:</strong> words, not tokens.
                Every number above is the step&apos;s whitespace word count — step 1 is{" "}
                <span className="font-mono text-ink">{T.steps[0].words}</span> words, the whole chain{" "}
                <span className="font-mono text-ink">{WORD_CAP}</span> — so you can check them by eye.
                A model actually bills in <em>tokens</em>, which depend on its tokenizer; the real
                figure is model-specific and is not computed here (no model runs on this page). Words
                stand in for the unit; the mechanism is the point.
              </p>
            </section>
          </section>

          {/* Step 2 — what the working bought */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              2. What the working bought
              <span className="ml-2 align-middle text-sm font-normal text-ink-muted">
                the Act 1 pair, priced
              </span>
            </h2>
            <section aria-label="System 1 versus System 2, in tokens" className="flex flex-col gap-3">
              <div className="grid items-stretch gap-3 sm:grid-cols-2">
                <div className="flex flex-col rounded-lg border-l-4 border-grid bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    System 1 · the blurt
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    The answer and nothing else. Cheap, instant. And here, wrong.
                  </p>
                  <p className="mt-2 font-mono text-sm text-ink-muted">
                    {T.blurt.trim().split(/\s+/).length} word · ✗
                  </p>
                </div>
                <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                    System 2 · the chain
                  </p>
                  <p className="mt-1 text-sm text-ink">
                    The extra working you spend, and what it buys: each line is another unit of
                    serial computation toward the answer.
                  </p>
                  <p className="mt-2 font-mono text-sm text-ink-muted">{WORD_CAP} words · ✓</p>
                </div>
              </div>
              <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
                Just as when a person solves a problem: blurting takes no time, but showing your
                work step by step takes <strong>focus and time</strong>. The only difference for a
                model is the currency: its focus and time <strong>are tokens</strong>.
              </div>
            </section>
          </section>

          {/* Step 3 — the measured version, now pressable */}
          <section className="flex flex-col gap-3">
            <h2 className="text-xl font-semibold text-ink">
              3. The same dial, measured for real
              <span className="ml-2 align-middle text-sm font-normal text-ink-muted">
                s1-32B · AIME24 · Muennighoff et al. 2025
              </span>
            </h2>
            <section
              aria-label="The measured version of this trade"
              className="flex flex-col gap-4 rounded-lg border-l-4 border-compute bg-surface p-4"
            >
              <p className="text-sm text-ink">
                Step 1 was an authored demonstration; this is a measurement. Forcing a real model to
                keep thinking, by appending the word{" "}
                <span className="font-mono text-ink">&ldquo;Wait&rdquo;</span> instead of letting it
                stop, moves AIME24 accuracy from{" "}
                <strong className="font-mono">{bp.start}%</strong> to{" "}
                <strong className="font-mono">{bp.end}%</strong>: no retraining, only more thinking
                tokens. Press it yourself.
              </p>

              {/* the "Wait" stepper */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onWait(appends + 1)}
                  disabled={appends >= WAIT_MAX}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  + &ldquo;Wait&rdquo; ▸
                </button>
                <button
                  type="button"
                  onClick={() => onWait(0)}
                  disabled={appends === 0}
                  className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink disabled:opacity-50"
                >
                  reset
                </button>
                <span className="font-mono text-sm tabular-nums text-ink-muted">
                  &ldquo;Wait&rdquo; × {appends} of {WAIT_MAX}
                </span>
              </div>

              {/* the thinking, extended one "Wait" at a time */}
              <p
                className="flex flex-wrap items-center gap-1 text-sm text-ink-muted"
                aria-hidden="true"
              >
                <span>the model keeps going</span>
                {Array.from({ length: appends }).map((_, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-compute/60 bg-compute/10 px-2 py-0.5 font-mono text-xs text-compute"
                  >
                    Wait
                  </span>
                ))}
              </p>

              {/* readouts: the accuracy and a representative problem flipping */}
              <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                <div className="flex flex-col rounded-lg border-l-4 border-compute bg-surface-raised px-4 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                    AIME24 accuracy
                  </p>
                  <p className="font-mono text-2xl tabular-nums text-ink">{acc.toFixed(1)}%</p>
                </div>
                <div
                  className={`rounded-lg border-l-4 px-3 py-2 text-sm text-ink ${
                    solved ? "border-correct bg-correct/15" : "border-wrong bg-wrong/15"
                  }`}
                >
                  <span className={`font-semibold ${solved ? "text-correct" : "text-wrong"}`}>
                    {solved ? "✓" : "✗"} a representative problem:{" "}
                  </span>
                  {solved
                    ? `solved — the extra thinking crossed the line at ${flipAt} "Wait"s.`
                    : `still wrong — it needs more thinking to land (flips at ${flipAt} "Wait"s).`}
                </div>
              </div>

              {/* the measured climb */}
              <LineChart
                title={`AIME24 accuracy for s1-32B against the number of "Wait" appends, climbing from ${bp.start} percent at zero appends to ${bp.end} percent at ${WAIT_MAX}. Currently marking ${appends} appends at ${acc.toFixed(1)} percent.`}
                points={pts}
                markPoints
                markerX={appends}
                xDomain={[0, WAIT_MAX]}
                yDomain={[48, 60]}
                xTicks={pts.map((p) => p.x)}
                xLabel={'number of "Wait" appends'}
                yLabel="AIME24 accuracy (%)"
                width={560}
                height={190}
              />

              <p className="text-sm text-ink-muted">
                Same trade as step 1, now on a real model: those are measured tokens, counted by the
                authors. The lever that does it, the &ldquo;Wait&rdquo; button, gets its own page
                (15).
              </p>
            </section>
          </section>

          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>This is inference-time scaling in its simplest form:</strong> trade compute at
            answer time for accuracy. A smaller model that thinks can land answers a bigger
            blurt misses. The next pages explore methods that push the same trade further.
          </div>
        </div>

        {/* RIGHT COLUMN — instructions + references */}
        <aside className="flex flex-col gap-6 border-t border-grid pt-6 lg:sticky lg:top-24 lg:self-start lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              How to read this page
            </h2>
            <ul className="flex flex-col gap-2 text-sm text-ink-muted">
              <li>Read straight down: spend the budget, see what it bought, then the real result.</li>
              <li>
                Drag the budget in step 1. A step only runs if its whole cost fits, so the chain
                stops where the money does.
              </li>
              <li>
                The meter counts <strong className="text-ink">words</strong>, not tokens; every
                number is checkable by eye.
              </li>
              <li>
                Use{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">←</kbd>{" "}
                <kbd className="rounded border border-grid bg-surface px-1 font-mono text-[11px] text-ink">→</kbd>{" "}
                to move between pages.
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              References
            </h2>
            <p className="text-sm text-ink-muted">
              Budget forcing: Muennighoff et al. 2025. Grounding: Kojima et al. 2022; theory: Feng
              et al. 2023 and Merrill &amp; Sabharwal 2024.
            </p>
            <p className="text-sm text-ink-muted">
              The chain in step 1 is authored, not a model transcript. Full links and derivation
              notes are at the foot of the page.
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={bf.citation} />
      </div>
      <p className="text-xs text-ink-muted">
        the five-step chain is an authored demonstration, not a model transcript · its costs are
        whitespace <strong>word</strong> counts, not tokenizer token counts; the page labels them
        as words throughout, and both the per-step counts and every intermediate value are
        recomputed from the step text by the test suite · a true token count is model-specific and
        would have to be measured against a particular tokenizer, which this page does not do ·
        the
        50% → 57% budget-forcing result is Muennighoff et al. 2025 (s1-32B, AIME24), treated in
        full on page 15 · grounding: Kojima et al. 2022, &ldquo;Large Language Models are
        Zero-Shot Reasoners&rdquo; (NeurIPS 2022, arXiv:2205.11916) · theory: Feng et al. 2023
        (NeurIPS 2023, arXiv:2305.15408) and Merrill &amp; Sabharwal 2024 (ICLR 2024,
        arXiv:2310.07923): longer chains extend the serial computation a transformer can perform
      </p>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
