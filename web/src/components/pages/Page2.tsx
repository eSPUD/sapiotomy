"use client";

/**
 * Page 2: The Machine's Two Speeds.
 *
 * Ported from prototypes/slide-2 (approved copy). Beats: the blurt ladder
 * (instant answers; right, right, right, then confidently wrong one size up),
 * a prediction gate before the last rung, the crack, then the reasoning trace
 * on the same problem the blurt missed. The honesty labels (informal test,
 * placeholder trace) ship with the page.
 */

import { useCallback, useEffect, useState } from "react";
import { LiveDemo } from "@/components/LiveDemo";
import { PageNav } from "@/components/PageNav";
import { Reveal } from "@/components/Reveal";
import { Slider } from "@/components/Slider";
import { INSTANT_BLURTS, TRACE_4502, TRACE_4502_ANSWER } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;

const BLURT_ROUNDS = INSTANT_BLURTS.rounds;
const CRACK_ROUND = BLURT_ROUNDS[3];

/** Note shown next to the ask button before the first rung. */
const ASK_START_NOTE = "2 + 2 first.";
/** Note shown after rung r lands (index r), teasing the next rung. */
const NEXT_NOTES = ["17 × 24 next.", "Now the big one from the game.", "One more, one size up."];
/** Verdict sublines for the three rungs that hold. */
const VERDICT_SUBS = [
  "Same as you.",
  "This is the one where you had to switch gears.",
  "In the game this one cost you minutes, or a give-up. The blurt did not even slow down.",
];

// Word geometry for the trace scrubber.
const SEG_WORDS: string[][] = TRACE_4502.map((s) => s.split(" "));
const SEG_STARTS: number[] = [];
const SEG_ENDS: number[] = [];
{
  let acc = 0;
  for (const words of SEG_WORDS) {
    SEG_STARTS.push(acc);
    acc += words.length;
    SEG_ENDS.push(acc);
  }
}
const TOTAL_WORDS = SEG_ENDS[SEG_ENDS.length - 1];

const fmt = (n: number) => n.toLocaleString("en-US");

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Page2() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  // --- the blurt ladder ---
  /** Rungs fully landed (answer typed + verdict shown). */
  const [completed, setCompleted] = useState(0);
  /** Rung currently typing its answer, if any. */
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeChars, setActiveChars] = useState(0);
  const [prediction, setPrediction] = useState<"holds" | "cracks" | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // --- the trace ---
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [docMode, setDocMode] = useState(false);
  const [traceDone, setTraceDone] = useState(false);

  /** Land rung r: show its verdict and announce the outcome. */
  const land = useCallback((r: number) => {
    setActiveRow(null);
    setCompleted(r + 1);
    const round = BLURT_ROUNDS[r];
    const ans = fmt(round.blurted);
    if (r < 3) {
      setAnnouncement(`${round.prompt}: answered ${ans} instantly, and it is right. ${NEXT_NOTES[r]}`);
    } else {
      setAnnouncement(
        `${round.prompt}: answered ${ans} instantly, and it is wrong. The true product is ${fmt(round.trueValue)}; off by ten thousand.`,
      );
    }
  }, []);

  // Type the active rung's answer character by character (about 45ms/char).
  useEffect(() => {
    if (activeRow === null) return;
    const r = activeRow;
    const text = fmt(BLURT_ROUNDS[r].blurted);
    let beat: ReturnType<typeof setTimeout> | undefined;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setActiveChars(i);
      if (i >= text.length) {
        clearInterval(timer);
        // A short beat before the last rung's verdict flips the row.
        if (r === 3) beat = setTimeout(() => land(r), 700);
        else land(r);
      }
    }, 45);
    return () => {
      clearInterval(timer);
      if (beat) clearTimeout(beat);
    };
  }, [activeRow, land]);

  const askNext = () => {
    if (activeRow !== null || completed >= 3) return;
    recordInteraction(PAGE_N);
    if (reducedMotion) {
      land(completed);
      return;
    }
    setActiveChars(0);
    setActiveRow(completed);
  };

  const predict = (choice: "holds" | "cracks") => {
    if (prediction !== null) return;
    recordInteraction(PAGE_N);
    setPrediction(choice);
  };

  // Once a prediction is locked, play the last rung.
  useEffect(() => {
    if (prediction === null || completed !== 3 || activeRow !== null) return;
    if (reducedMotion) {
      land(3);
      return;
    }
    const t = setTimeout(() => {
      setActiveChars(0);
      setActiveRow(3);
    }, 500);
    return () => clearTimeout(t);
  }, [prediction, completed, activeRow, reducedMotion, land]);

  // Play the trace word by word (about 60ms/word).
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setPos((p) => (p < TOTAL_WORDS ? p + 1 : p));
    }, 60);
    return () => clearInterval(timer);
  }, [playing]);

  // Reaching the last word finishes the trace exactly once.
  useEffect(() => {
    if (pos < TOTAL_WORDS) return;
    setPlaying(false);
    if (!traceDone) {
      setTraceDone(true);
      setAnnouncement(
        `Trace finished. The answer is ${fmt(TRACE_4502_ANSWER)}; the blurt was wrong and the thinking caught it.`,
      );
    }
  }, [pos, traceDone]);

  const onPlayClick = () => {
    recordInteraction(PAGE_N);
    if (reducedMotion) {
      // Step-through mode: one trace segment per press.
      const idx = SEG_ENDS.findIndex((end) => pos < end);
      if (idx === -1) return;
      const next = SEG_ENDS[idx];
      setPos(next);
      if (next < TOTAL_WORDS) setAnnouncement(`Step ${idx + 1} of ${TRACE_4502.length} shown.`);
      return;
    }
    if (playing) {
      setPlaying(false);
      // Matches the prototype: no "paused" call-out once the trace has finished.
      if (pos < TOTAL_WORDS) setAnnouncement("Trace paused.");
      return;
    }
    if (pos >= TOTAL_WORDS) return;
    setPlaying(true);
    setAnnouncement("Trace playing.");
  };

  const onJumpToEnd = () => {
    recordInteraction(PAGE_N);
    setPlaying(false);
    setPos(TOTAL_WORDS);
  };

  const onScrub = (v: number) => {
    recordInteraction(PAGE_N);
    setPlaying(false);
    setPos(v);
  };

  const onDocMode = () => {
    recordInteraction(PAGE_N);
    const on = !docMode;
    setDocMode(on);
    if (on) {
      setPlaying(false);
      setPos(TOTAL_WORDS);
    }
  };

  const shownRows = Math.max(completed, activeRow !== null ? activeRow + 1 : 0);
  const playLabel = reducedMotion ? "Show next step ▸" : playing ? "⏸ Pause" : "▶ Play";
  const optionClass = (selected: boolean) =>
    `min-w-[150px] flex-1 rounded border px-3 py-2 text-sm text-ink ${
      selected ? "border-compute bg-compute/40 font-semibold" : "border-grid bg-surface-raised"
    }`;

  return (
    <article className="flex flex-col gap-5">
      <p className="text-xs uppercase tracking-wide text-ink-muted">
        Act {page.act} · {ACTS[page.act].title}
      </p>
      <h1 className="text-3xl font-bold text-ink">
        <span className="font-mono text-ink-muted">{page.n}. </span>
        {page.title}
      </h1>
      <p className="max-w-2xl text-lg text-ink-muted">
        The game ended on a question: what if something answered instantly, no matter how big the
        problem gets? There is such a thing. Ask an AI agent to answer with{" "}
        <strong>no thinking allowed</strong>, and the answer just arrives: no steps, no pause, no
        scratch work. Let&apos;s find out what that is worth.
      </p>

      <section aria-label="Instant mode" className="flex flex-col gap-4">
        <p className="max-w-2xl text-ink">
          Same problems as the game, plus one size the game never reached. The rule for the agent:{" "}
          <strong>first thing that pops, no working it out.</strong> You know what each of these
          cost you. Watch what they cost it.
        </p>

        <div className="overflow-hidden rounded-lg border border-grid bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>instant mode: no thinking allowed</span>
            <span className="flex flex-wrap gap-1.5">
              <span className="rounded-full border border-compute/60 px-2 py-0.5 text-compute">
                {`informal real test · ${INSTANT_BLURTS.model} · ${INSTANT_BLURTS.testedOn}`}
              </span>
              <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                re-run + log before shipping
              </span>
            </span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {BLURT_ROUNDS.slice(0, shownRows).map((round, i) => {
              const done = i < completed;
              const isCracked = i === 3 && done;
              const answerText = fmt(round.blurted);
              const shownText = done ? answerText : answerText.slice(0, activeChars);
              return (
                <div
                  key={round.prompt}
                  className={`rounded-lg border p-3 ${
                    isCracked ? "border-wrong bg-wrong/15" : "border-grid bg-surface-raised"
                  }`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <span className="font-mono text-lg font-semibold text-ink">{round.prompt}</span>
                    <span className="min-h-[1.3em] font-mono text-lg tabular-nums text-ink">
                      {shownText}
                    </span>
                  </div>
                  {done &&
                    (i < 3 ? (
                      <p className="mt-1 text-sm text-correct">
                        ✓ instant, right.{" "}
                        <span className="text-ink-muted">{VERDICT_SUBS[i]}</span>
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-wrong">
                        ✗ wrong.{" "}
                        <span className="text-ink-muted">
                          The true product is{" "}
                          <strong className="font-mono tabular-nums text-ink">
                            {fmt(round.trueValue)}
                          </strong>
                          . Off by exactly {fmt(round.trueValue - round.blurted)}, and delivered
                          with the same certainty as the other three.
                        </span>
                      </p>
                    ))}
                </div>
              );
            })}
            {completed < 3 && (
              <div className="mt-1 flex items-center gap-3">
                <button
                  type="button"
                  onClick={askNext}
                  disabled={activeRow !== null}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  Ask it ▸
                </button>
                <span className="text-sm text-ink-muted">
                  {completed === 0 ? ASK_START_NOTE : NEXT_NOTES[completed - 1]}
                </span>
              </div>
            )}
          </div>
        </div>

        {completed >= 3 && (
          <Reveal>
            <div className="rounded-lg border border-grid bg-surface p-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">
                Before the last one, a prediction
              </p>
              <p className="mt-1 text-lg text-ink">
                Three for three, and the third one beat your best time by minutes. Next up is a
                size the game never reached: <strong className="font-mono">{CRACK_ROUND.prompt}</strong>.
                Does the blurt hold?
              </p>
              <div
                role="group"
                aria-label="Your prediction for the biggest problem"
                className="mt-3 flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  aria-pressed={prediction === "holds"}
                  onClick={() => predict("holds")}
                  className={optionClass(prediction === "holds")}
                >
                  It holds
                </button>
                <button
                  type="button"
                  aria-pressed={prediction === "cracks"}
                  onClick={() => predict("cracks")}
                  className={optionClass(prediction === "cracks")}
                >
                  It cracks
                </button>
              </div>
              {prediction !== null && (
                <p className="mt-3 max-w-2xl text-ink">
                  {prediction === "holds"
                    ? "A fair bet; the streak has been perfect. Watch."
                    : "A suspicious mind. Watch."}
                </p>
              )}
            </div>
          </Reveal>
        )}
      </section>

      {completed === 4 && (
        <section aria-label="The crack" className="flex flex-col gap-4">
          <Reveal>
            <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
              <strong>Nothing on the surface changed.</strong> No hesitation, no &ldquo;probably&rdquo;,
              no smaller font. It handed over a wrong number with exactly the confidence of the
              three right ones. And the miss is close: within four hundredths of a percent, near
              enough to sail past anyone not checking. That is the trouble with a pop: it is a
              guess wearing certainty&apos;s clothes, and it does not know when it is wrong.
            </div>
          </Reveal>
          <p className="max-w-2xl text-ink">
            So give the agent what round 3 of the game gave you:{" "}
            <strong>permission to think.</strong> Same problem, thinking allowed. Here is the
            reasoning trace, its actual scratch work, one step at a time.
          </p>

          <div className="overflow-hidden rounded-lg border border-grid bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
              <span>{`the agent's scratch work · ${CRACK_ROUND.prompt}`}</span>
              <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                placeholder trace (real run to follow)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 border-b border-grid px-4 py-3">
              <button
                type="button"
                onClick={onPlayClick}
                className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
              >
                {playLabel}
              </button>
              <button
                type="button"
                onClick={onJumpToEnd}
                className="rounded bg-surface-raised px-3 py-1.5 text-sm text-ink"
              >
                ⏭ Jump to end
              </button>
              <div className="min-w-[160px] flex-1">
                <Slider
                  label="Scrub through the trace"
                  min={0}
                  max={TOTAL_WORDS}
                  value={pos}
                  onChange={onScrub}
                  suffix={` of ${TOTAL_WORDS} words`}
                />
              </div>
              <button
                type="button"
                aria-pressed={docMode}
                onClick={onDocMode}
                className={`rounded border px-3 py-1.5 text-sm text-ink ${
                  docMode ? "border-compute bg-compute/40 font-semibold" : "border-grid bg-surface-raised"
                }`}
              >
                Read as document
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto p-4">
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-muted">thinking…</p>
              <div className="max-w-2xl text-sm leading-relaxed text-ink">
                {SEG_WORDS.map((words, i) => {
                  const visible = docMode
                    ? words.length
                    : Math.max(0, Math.min(words.length, pos - SEG_STARTS[i]));
                  if (visible <= 0) return null;
                  return <span key={i}>{words.slice(0, visible).join(" ")} </span>;
                })}
              </div>
              {traceDone && (
                <p className="mt-3 border-t border-dashed border-grid pt-3 text-lg text-ink">
                  Answer:{" "}
                  <strong className="font-mono tabular-nums">
                    {CRACK_ROUND.prompt} = {fmt(TRACE_4502_ANSWER)}
                  </strong>
                  <span className="mt-1 block text-sm text-ink-muted">
                    The blurt said {fmt(CRACK_ROUND.blurted)}. Six steps of checking caught it.
                  </span>
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {traceDone && (
        <section aria-label="After the trace" className="flex flex-col gap-4">
          <Reveal>
            <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              Notice what the trace did. It opened with <em>the very same pop</em>, then refused to
              trust it: broke the problem into pieces, worked each piece, hit a mismatch, and
              checked again by a different route. The instant answer is still in there; thinking is
              what catches it when it is wrong.{" "}
              <strong>More steps, more time, and the answer flipped from wrong to right.</strong>
            </div>
          </Reveal>

          <div className="rounded-lg border border-grid bg-surface p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">Honesty note</p>
            <p className="mt-1 max-w-2xl text-ink">
              In day-to-day use, a modern agent asked for arithmetic will usually just grab a
              calculator: one line of code,{" "}
              <code className="rounded bg-surface-raised px-1 font-mono text-sm">
                print(4502 * 6398)
              </code>
              , done. Arithmetic is this deck&apos;s demo because you can feel every step of it in
              your own head. The two speeds are real and they are everywhere; the multiplication is
              just the cleanest place to watch them.
            </p>
          </div>

          <p className="max-w-2xl text-ink">
            <em>
              So: the pop is fast and silent about its failures, and thinking catches them. A fair
              rule so far: when the problem gets big, turn the thinking up. Does that rule always
              hold? Tonight happens to offer the perfect test. Next page: match night.
            </em>
          </p>
          <p className="text-xs text-ink-muted">
            the instant answers reproduce an informal test of a real agent ({INSTANT_BLURTS.model},{" "}
            {INSTANT_BLURTS.testedOn}, verbatim); the trace is a labeled placeholder · no accuracy
            percentages or benchmark numbers appear on this page · framing: Kahneman,{" "}
            <em>Thinking, Fast and Slow</em>
          </p>

          <LiveDemo
            prompt="What is 4502 x 6398? Think through it step by step."
            fallbackTrace={TRACE_4502}
          />
        </section>
      )}

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
