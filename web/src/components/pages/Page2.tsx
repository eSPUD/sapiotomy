"use client";

/**
 * Page 2, "Two Systems" (docs/page_2_refactor.md). One question: how many World
 * Cups has Spain won? A reader who followed the tournaments counts instantly
 * (System 1); a machine whose memory was sealed before the 2026 final counts
 * off stale data and lands one short. The failure names the two systems: the
 * question looks like a System-1 lookup, but the freshest fact never reached
 * the machine, so even careful counting (System 2) starves for raw material.
 * The training question is only the closing teaser; no inference talk here.
 *
 * Layout rule (revision, 2026-07): no pop-ups, no reveals. The question, the
 * machine panel, and the whole analysis are on screen from the first paint;
 * steps the reader has not reached yet are grayed out, never hidden.
 */

import { useEffect, useMemo, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = SPAIN_WORLD_CUPS;

/** Milliseconds per streamed word of the machine's reply. */
const STREAM_MS = 55;

/** Lenient count parse: a bare integer, or the number word for 0–6. */
function parseCount(raw: string): number | null {
  const s = raw.trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  const words: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
  };
  return s in words ? words[s] : null;
}

/**
 * The machine's reply. Today this resolves the authored blurt instantly; the
 * planned live route (a small open model behind a free API, still with NO web
 * search) replaces the body of this function and nothing else.
 */
async function fetchMachineReply(): Promise<readonly string[]> {
  return WC.machine.reply;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type RunState = "idle" | "streaming" | "done";

export function Page2() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  // --- the question, played by the reader ---
  const [guess, setGuess] = useState("");
  const [answered, setAnswered] = useState(false);
  const [overrode, setOverrode] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // --- the machine's reply ---
  const [reply, setReply] = useState<readonly string[] | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [pos, setPos] = useState(0);

  const segWords = useMemo(() => (reply ?? []).map((p) => p.split(" ")), [reply]);
  const segStarts = useMemo(() => {
    let acc = 0;
    return segWords.map((w) => {
      const s = acc;
      acc += w.length;
      return s;
    });
  }, [segWords]);
  const totalWords = useMemo(() => segWords.reduce((n, w) => n + w.length, 0), [segWords]);

  const locked = answered || overrode;
  const guessedRight = answered && parseCount(guess) === WC.trueCount;

  const submitGuess = () => {
    if (locked || guess.trim().length === 0) return;
    recordInteraction(PAGE_N);
    setAnswered(true);
    setAnnouncement(
      parseCount(guess) === WC.trueCount
        ? `${WC.trueCount}: right, and if you followed along it took zero steps. The machine's run button is unlocked.`
        : `You said ${guess.trim()}; the record here is ${WC.trueCount}. The machine's run button is unlocked.`,
    );
  };

  const passToMachine = () => {
    if (locked) return;
    recordInteraction(PAGE_N);
    setOverrode(true);
    setAnnouncement("You passed the question to the machine. Press run to watch it try.");
  };

  const finishNote = `The machine answered ${WC.machine.answer} — one short of the record, its memory sealed before the 2026 final. The two systems comparison is below.`;

  const onRun = async () => {
    if (!locked || runState !== "idle") return;
    recordInteraction(PAGE_N);
    const r = await fetchMachineReply();
    setReply(r);
    if (reducedMotion) {
      setPos(r.reduce((n, p) => n + p.split(" ").length, 0));
      setRunState("done");
      setAnnouncement(finishNote);
    } else {
      setPos(0);
      setRunState("streaming");
      setAnnouncement("The machine is replying.");
    }
  };

  // Stream the reply word by word.
  useEffect(() => {
    if (runState !== "streaming") return;
    const t = setInterval(() => setPos((p) => p + 1), STREAM_MS);
    return () => clearInterval(t);
  }, [runState]);

  // Reaching the last word finishes the run exactly once.
  useEffect(() => {
    if (runState !== "streaming" || totalWords === 0 || pos < totalWords) return;
    setRunState("done");
    setAnnouncement(finishNote);
  }, [pos, totalWords, runState, finishNote]);

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
        No mental math this time. One plain question of record —{" "}
        <strong>how many World Cups has Spain won?</strong> You answer first, then the machine
        takes the same question.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section aria-label="The question" className="overflow-hidden rounded-lg border border-grid bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>your turn · one question · your best count</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              2026 result: authored placeholder · verify before shipping
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-lg text-ink">{WC.question}</p>

            {!locked ? (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitGuess();
                }}
              >
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  aria-label="How many World Cups Spain has won"
                  placeholder="a number"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  className="w-28 rounded border border-grid bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-muted"
                />
                <button
                  type="submit"
                  disabled={guess.trim().length === 0}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  Answer
                </button>
                <span className="text-sm text-ink-muted">or</span>
                <button
                  type="button"
                  onClick={passToMachine}
                  className="rounded border border-grid bg-surface-raised px-3 py-2 text-sm text-ink"
                >
                  Let the machine take it ▸
                </button>
              </form>
            ) : null}

            {answered ? (
              <p className="text-ink">
                {guessedRight ? (
                  <>
                    <span className="text-correct">✓ Two.</span>{" "}
                    <span className="text-ink-muted">
                      Spain won in 2010 and again in 2026. Followed along? Then it just{" "}
                      <em>popped</em> — no steps, the count was simply <em>there</em>, the way 4 is
                      there for 2 + 2.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-wrong">✗ You said {guess.trim()};</span>{" "}
                    <span className="text-ink-muted">
                      the record is <strong className="text-ink">two</strong> — 2010, and again in
                      2026, days ago. Miss the recent one and there is nothing to <em>work out</em>:
                      a title you never saw cannot be derived, only recalled.
                    </span>
                  </>
                )}
              </p>
            ) : null}

            {overrode ? (
              <p className="text-ink">
                Fair enough — you passed. A count you either kept or you didn&apos;t; nothing to
                figure out. Now watch the machine in that exact spot.
              </p>
            ) : null}
          </div>
        </section>

        <section
          aria-label="The machine tries the question"
          className={`overflow-hidden rounded-lg border bg-surface ${
            locked ? "border-grid" : "border-dashed border-grid"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>{`${WC.machine.label} · ${WC.machine.cutoffLabel} · ${WC.machine.constraintLabel}`}</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              example reply, authored · live model to follow
            </span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            <p className="text-sm text-ink-muted">
              Same question. But its memory was sealed{" "}
              <strong className="text-ink">early 2025</strong>, before this summer&apos;s final, and
              it has <strong className="text-ink">no web search</strong>.
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-muted">you →</p>
            <p className="text-ink">{WC.question}</p>
            <p className="mt-2 border-t border-dashed border-grid pt-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
              the machine →
            </p>
            {runState === "idle" ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onRun}
                  disabled={!locked}
                  className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
                >
                  Run it ▸
                </button>
                {!locked ? (
                  <span className="text-xs text-ink-muted">
                    unlocks once you answer, or pass, on the left
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="text-sm leading-relaxed text-ink">
                {runState === "streaming" && pos === 0 ? (
                  <span aria-hidden="true" className="animate-pulse text-compute">
                    ▍
                  </span>
                ) : null}
                {segWords.map((words, i) => {
                  const visible = Math.max(0, Math.min(words.length, pos - segStarts[i]));
                  if (visible <= 0) return null;
                  const isHead =
                    runState === "streaming" &&
                    pos >= segStarts[i] &&
                    pos < segStarts[i] + words.length;
                  return (
                    <p key={i} className={i > 0 ? "mt-2" : undefined}>
                      {words.slice(0, visible).join(" ")}
                      {isHead ? (
                        <span aria-hidden="true" className="animate-pulse text-compute">
                          ▍
                        </span>
                      ) : null}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <section aria-label="Two systems, one question" className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-grid bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-compute">
              System 1 · the pop
            </p>
            <p className="mb-1 mt-1 text-lg font-semibold text-ink">
              A stored fact, recalled whole.
            </p>
            <p className="font-mono text-sm text-ink-muted">question → memory → answer</p>
            <p className="mt-2 text-sm text-ink-muted">
              Zero steps, zero time. It is either in there, or it is nowhere.
            </p>
          </div>
          <div className="rounded-lg border border-grid bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-compute">
              System 2 · the steps
            </p>
            <p className="mb-1 mt-1 text-lg font-semibold text-ink">
              An answer built from parts.
            </p>
            <p className="font-mono text-sm text-ink-muted">
              question → gather the pieces → work them → answer
            </p>
            <p className="mt-2 text-sm text-ink-muted">
              Slow and effortful, and it needs raw material: facts to gather, then reason over.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-2">
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>Looks like a System 1 question.</strong> A count like this should just pop
            {answered ? <>, the way it may have for you</> : null} — follow every tournament and it
            is simply <em>there</em>. The machine has no such luck: the newest title never reached
            its memory, so it counts what it has and stops one short.
          </div>

          <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
            <strong>The trap:</strong> it does not hesitate. It counts confidently off a memory that
            ends before this summer — {WC.trueCount} titles reported as {WC.machine.answer}. The
            right method on stale facts, delivered with a straight face.
          </div>
        </div>

        <p className="max-w-2xl text-ink">
          <em>
            The machine failed because the latest World Cup was never in its memory. So what is the
            fix for questions like these? What if the model{" "}
            <strong>were trained on data that includes that final</strong>, recent as it is? That is
            the next page.
          </em>
        </p>

        <p className="text-xs text-ink-muted">
          the question is real and recent on purpose · Spain&apos;s 2010 title is real, but the 2026
          win — and so the count of two — is an authored placeholder; verify the final&apos;s result
          before shipping · the machine&apos;s reply is an authored example of a confident System-1
          miss; a live open model with no web search replaces it later · framing: Kahneman,{" "}
          <em>Thinking, Fast and Slow</em>
        </p>
      </section>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
