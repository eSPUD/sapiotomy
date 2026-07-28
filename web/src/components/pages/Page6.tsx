"use client";

/**
 * Page 6, "Thinking Longer" — the deck's first naming of inference-time
 * compute. Page 5 showed the road (a chain on the page); this page puts a
 * meter on it: every unit of working written before committing is computation
 * spent, so a budget on that working directly sets the bar for how long the
 * model may think. The interactive is an authored five-step chain
 * (lib/authored THINK_BUDGET, 47 x 63 - 29 x 41 = 1,772): drag the budget from
 * 0 to the cap and watch the answer flip wrong -> right while the working fills
 * in. System 1 vs System 2 carries over from Act 1: blurting takes no time;
 * showing your work takes focus and time — for a model, that focus-and-time
 * currency IS tokens. The measured version of the trade is the cited s1 result
 * (budget forcing, 50% -> 57% on AIME24), measured on step 3's "Wait" dial —
 * this page is its full treatment.
 *
 * UNITS (load-bearing): the meter counts WORDS, not tokenizer tokens. The
 * authored costs are whitespace word counts and nothing on this page may label
 * them "tokens" — a real token count is model-specific and has to be measured
 * (for Claude, /v1/messages/count_tokens). "Token" stays in the prose as the
 * concept; every NUMBER on screen is a word count, and the chip on the demo
 * says so. See lib/authored THINK_BUDGET for the full units note.
 *
 * HONESTY (load-bearing): the zero-budget end of the dial is an idealization.
 * You cannot actually hold a model to a one-word answer, and a model told to
 * think longer will spend more words than the problem needs. That caveat is the
 * closing muted line of step 2's prose card, one card below the "1 word"
 * readout it qualifies; it must stay in the step body — do not move it to a
 * margin note and do not drop it.
 *
 * Layout: shell matches page 1 — one reading column of numbered steps, each
 * beside its own margin note that scrolls with it. No sticky how-to-read rail:
 * references sit in the margin beside the step that uses them as bare cites,
 * with the arXiv link carried by the CitationBadge row below the grid, and the
 * provenance caveats sit as chips on the control they qualify. A margin note is
 * either an operating hint or a bare "References" list; explanation inside a
 * control is limited to what a reader cannot get by operating it.
 *
 * The demonstration is authored and flagged; no live model. Theory grounding
 * cited beside step 1: Kojima et al. 2022 (zero-shot "Let's think step by
 * step"), Feng et al. 2023 and Merrill & Sabharwal 2024 (chain length extends
 * the serial computation a transformer can perform).
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

/** A margin note that sits beside its step and scrolls with the page. */
function Note({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <aside className="flex flex-col gap-2 text-sm text-ink-muted lg:pt-9">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{kicker}</p>
      {children}
    </aside>
  );
}

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
        `Budget ${WORD_CAP} words: all ${T.steps.length} steps are written and the answer flips to ${T.display} (correct).`,
      );
    } else if (v === 0) {
      setAnnouncement(`Budget zero: the model blurts ${T.blurt} (wrong).`);
    }
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
        Showing your work takes time. For a model, that time is the{" "}
        <strong className="text-ink">words it writes before it answers</strong>, so a cap on the
        words is a cap on the thinking. Here is that cap, on a dial.
      </p>

      {/* Each step (left) sits beside its own note (right); the whole page scrolls. */}
      <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        {/* Step 1 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">1. Spend the budget</h2>
          <section
            aria-label="The compute-budget demo"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-grid px-2 py-0.5 text-ink-muted">
                counts words, not tokens
              </span>
              <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                written for this page, no live model
              </span>
            </div>

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
              <div className="flex items-center gap-1" aria-hidden="true">
                {T.steps.map((s, i) => (
                  <span
                    key={i}
                    className={`h-3 w-7 rounded-sm ${i < depth ? "bg-compute" : "border border-grid bg-surface-raised"}`}
                  />
                ))}
              </div>
              <p className="font-mono text-sm tabular-nums text-ink">
                {depth} of {T.steps.length} steps written
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
                    <span className="flex-1">{afforded ? s.text : "· · · (not written)"}</span>
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
                    All five steps fit the budget, each one leaning on the one before it.
                  </span>
                </p>
              </div>
            ) : depth === 0 ? (
              <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">
                  <span className="font-semibold text-wrong">✗ {T.blurt}.</span>{" "}
                  <span className="text-sm text-ink-muted">
                    Nothing written, so nothing worked out: a borrow slipped in the subtraction it
                    never put down.
                  </span>
                </p>
              </div>
            ) : (
              <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-3">
                <p className="text-ink">
                  <span className="font-semibold text-wrong">✗ out of budget mid-chain.</span>{" "}
                  <span className="text-sm text-ink-muted">
                    The working stopped after step {depth}, so it had to guess the rest: {T.blurt}{" "}
                    again.
                  </span>
                </p>
              </div>
            )}
          </section>
        </section>
        <Note kicker="References">
          <p>
            Kojima et al. 2022, <em>Large Language Models are Zero-Shot Reasoners</em>.
          </p>
          <p>
            Feng et al. 2023, <em>Towards Revealing the Mystery behind Chain of Thought</em>.
          </p>
          <p>
            Merrill &amp; Sabharwal 2024, <em>The Expressive Power of Transformers with Chain of
            Thought</em>.
          </p>
        </Note>

        {/* Step 2 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">2. What the working bought</h2>
          <section aria-label="System 1 versus System 2, in tokens" className="flex flex-col gap-3">
            <div className="grid items-stretch gap-3 sm:grid-cols-2">
              <div className="flex flex-col rounded-lg border border-grid bg-surface p-4">
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
              <div className="flex flex-col rounded-lg border border-grid bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-compute">
                  System 2 · the chain
                </p>
                <p className="mt-1 text-sm text-ink">
                  Five lines of working, each one leaning on the last, and the answer lands.
                </p>
                <p className="mt-2 font-mono text-sm text-ink-muted">{WORD_CAP} words · ✓</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 rounded-lg border border-grid bg-surface p-4 leading-relaxed text-ink">
              <p>
                Same as when a person solves a problem: blurting takes no time, but showing your work
                step by step takes <strong>focus and time</strong>. The only difference for a model
                is the currency. Its focus and time <strong>are tokens</strong>, the words it writes
                on the way to an answer.
              </p>
              <p className="text-sm text-ink-muted">
                The one-word end is an idealization: you cannot really hold a model to one word, and
                asking for the number alone will often still get you its working. Told to think
                longer it overspends instead; the count is the model&apos;s call, not yours.
              </p>
            </div>
          </section>
        </section>
        <div aria-hidden="true" />

        {/* Step 3 */}
        <section className="flex min-w-0 flex-col gap-3">
          <h2 className="text-xl font-semibold text-ink">3. The same dial, measured for real</h2>
          <section
            aria-label="The measured version of this trade"
            className="flex flex-col gap-4 rounded-lg border border-grid bg-surface p-4"
          >
            <p className="text-sm text-ink">
              Step 1 was written for this page. This is a measurement. Made to keep going, by
              appending the word <span className="font-mono text-ink">&ldquo;Wait&rdquo;</span>{" "}
              every time it tries to stop, a real model (s1-32B) climbs from{" "}
              <strong className="font-mono">{bp.start}%</strong> to{" "}
              <strong className="font-mono">{bp.end}%</strong> on a hard competition maths exam. No
              retraining, only more thinking. Press it yourself.
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
            <p className="flex flex-wrap items-center gap-1 text-sm text-ink-muted" aria-hidden="true">
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
              <div className="flex flex-col rounded-lg border border-grid bg-surface-raised px-4 py-2">
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
                  ? `solved, the extra thinking crossed the line at ${flipAt} "Wait"s.`
                  : `still wrong, it needs more thinking to land (flips at ${flipAt} "Wait"s).`}
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
              Same trade as step 1, now on a real model. The lever that does it, the
              &ldquo;Wait&rdquo; button, gets its own page (15).
            </p>
          </section>
        </section>
        <Note kicker="References">
          <p>
            Muennighoff et al. 2025, <em>s1: Simple Test-Time Scaling</em>.
          </p>
        </Note>

        {/* Close */}
        <section className="flex min-w-0 flex-col gap-3">
          <div className="rounded-lg border border-grid bg-surface p-4 leading-relaxed text-ink">
            <strong>This is inference-time scaling in its simplest form:</strong> trade compute at
            answer time for accuracy. A smaller model that thinks can land answers a bigger blurt
            misses. The next pages explore methods that push the same trade further.
          </div>
        </section>
        <div aria-hidden="true" />
      </div>

      <div className="flex flex-wrap gap-2">
        <CitationBadge citation={bf.citation} />
      </div>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
