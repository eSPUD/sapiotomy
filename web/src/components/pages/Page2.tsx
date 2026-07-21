"use client";

/**
 * Page 2, "Two Systems" (docs/page_2_refactor.md). One question: who won the
 * FIFA 2026 World Cup? The reader answers first (or hands the question
 * straight to the machine), then watches a machine whose memory predates the
 * final try the same question with no web search. Its honest failure names
 * the two systems: the question looks like a System 1 lookup, but a fact that
 * never reached the machine forces System 2, and System 2 starves with
 * nothing to look up. The training question is only the closing teaser; no
 * inference talk on this page.
 */

import { useEffect, useMemo, useState } from "react";
import { PageNav } from "@/components/PageNav";
import { Reveal } from "@/components/Reveal";
import { WORLD_CUP_2026 } from "@/lib/authored";
import { ACTS, getPage } from "@/lib/pages";
import { useStore } from "@/store/useStore";

const PAGE_N = 2;
const WC = WORLD_CUP_2026;

/** Milliseconds per streamed word of the machine's reply. */
const STREAM_MS = 55;

/**
 * The machine's reply. Today this resolves the authored example instantly;
 * the planned live route (a small open model behind a free API, still with NO
 * web search) replaces the body of this function and nothing else.
 */
async function fetchMachineReply(): Promise<readonly string[]> {
  return WC.exampleReply;
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
  const [humanPick, setHumanPick] = useState<number | null>(null);
  const [overrode, setOverrode] = useState(false);
  const [machineOpen, setMachineOpen] = useState(false);
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

  const locked = humanPick !== null || overrode;
  const winner = WC.options[WC.winnerIndex];
  const pickedRight = humanPick !== null && humanPick === WC.winnerIndex;

  const pick = (i: number) => {
    if (locked) return;
    recordInteraction(PAGE_N);
    setHumanPick(i);
    setAnnouncement(
      i === WC.winnerIndex
        ? `${WC.options[i]}: right, and it took zero steps. Next, hand the same question to the machine.`
        : `You said ${WC.options[i]}; the recorded winner here is ${winner}. Next, hand the same question to the machine.`,
    );
  };

  const overrideToMachine = () => {
    if (locked || machineOpen) return;
    recordInteraction(PAGE_N);
    setOverrode(true);
    setMachineOpen(true);
    setAnnouncement("You passed the question to the machine. Press run to watch it try.");
  };

  const handToMachine = () => {
    if (machineOpen) return;
    recordInteraction(PAGE_N);
    setMachineOpen(true);
    setAnnouncement("The machine has the question. Press run to watch it try.");
  };

  const onRun = async () => {
    if (runState !== "idle") return;
    recordInteraction(PAGE_N);
    const r = await fetchMachineReply();
    setReply(r);
    if (reducedMotion) {
      setPos(r.reduce((n, p) => n + p.split(" ").length, 0));
      setRunState("done");
      setAnnouncement(
        "The machine declined to guess: its training data ends before the final. The two systems comparison is below.",
      );
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
    setAnnouncement(
      "The machine declined to guess: its training data ends before the final. The two systems comparison is below.",
    );
  }, [pos, totalWords, runState]);

  const optionClass = (selected: boolean) =>
    `rounded border px-4 py-2.5 text-center text-sm ${
      selected
        ? "border-compute bg-compute/40 font-semibold text-ink"
        : "border-grid bg-surface-raised text-ink"
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
        Page 1 clocked your two gears on arithmetic. Now a question with no arithmetic in it at
        all. The <strong>2026 World Cup</strong> is done: the final has been played, the cup handed
        over. Four names; one of them lifted it.
      </p>

      <section aria-label="The question" className="flex flex-col gap-3">
        <div className="overflow-hidden rounded-lg border border-grid bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>one question · four names</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              answer key: authored placeholder · verify before shipping
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:p-6">
            <p className="text-lg text-ink">{WC.question}</p>
            <div role="group" aria-label="The four names" className="grid gap-2 sm:grid-cols-2">
              {WC.options.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={humanPick === i}
                  onClick={() => pick(i)}
                  className={optionClass(humanPick === i)}
                >
                  {name}
                  {humanPick === i ? <span aria-hidden="true"> ✓</span> : null}
                </button>
              ))}
            </div>

            {humanPick !== null ? (
              <p className="max-w-2xl text-ink">
                {pickedRight ? (
                  <>
                    <span className="text-correct">✓ {winner}.</span>{" "}
                    <span className="text-ink-muted">
                      And clock how the answer arrived: no steps, no scratch work, not even a
                      pause. The name was simply <em>there</em>, the way 4 was there for 2 + 2. A
                      watched final files itself.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-wrong">✗ You said {WC.options[humanPick]};</span>{" "}
                    <span className="text-ink-muted">
                      the record says <strong className="text-ink">{winner}</strong>. Notice there
                      was still nothing to <em>work out</em>: a result you never saw cannot be
                      derived, only remembered. It was in there, or it was not.
                    </span>
                  </>
                )}
              </p>
            ) : null}

            {!machineOpen ? (
              humanPick !== null ? (
                <div>
                  <button
                    type="button"
                    onClick={handToMachine}
                    className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas"
                  >
                    Now hand the same question to the machine ▸
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-ink-muted">or skip yourself entirely:</span>
                  <button
                    type="button"
                    onClick={overrideToMachine}
                    className="rounded border border-grid bg-surface-raised px-4 py-2 text-sm text-ink"
                  >
                    Don&apos;t answer. Let the machine take it ▸
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </section>

      {machineOpen ? (
        <Reveal>
          <section aria-label="The machine tries the question" className="flex flex-col gap-3">
            <p className="max-w-2xl text-ink">
              {overrode ? (
                <>
                  Fair enough; you passed. Notice what passing means here: nothing to figure out,
                  so either the night is filed in your memory or there is no path to an answer at
                  all. Now watch a machine in that exact spot. Two facts about it, both on the
                  label: its memory was sealed <strong>early in 2025</strong>, months before this
                  final, and it has <strong>no web search</strong>.
                </>
              ) : (
                <>
                  Now the exact same question goes to a machine. Two facts about it before it
                  starts, both on the label: its memory was sealed <strong>early in 2025</strong>,
                  months before this final, and it has <strong>no web search</strong>.
                </>
              )}
            </p>

            <div className="overflow-hidden rounded-lg border border-grid bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
                <span>{`${WC.machine.label} · ${WC.machine.cutoffLabel} · ${WC.machine.constraintLabel}`}</span>
                <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
                  example reply, authored · live model to follow
                </span>
              </div>
              <div className="flex flex-col gap-2 p-4">
                <p className="font-mono text-xs uppercase tracking-wide text-ink-muted">you →</p>
                <p className="max-w-2xl text-ink">
                  {WC.question} {WC.options.join(", ")}?
                </p>
                <p className="mt-2 border-t border-dashed border-grid pt-3 font-mono text-xs uppercase tracking-wide text-ink-muted">
                  the machine →
                </p>
                {runState === "idle" ? (
                  <div>
                    <button
                      type="button"
                      onClick={onRun}
                      className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas"
                    >
                      Run it ▸
                    </button>
                  </div>
                ) : (
                  <div className="max-w-2xl text-sm leading-relaxed text-ink">
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
            </div>
          </section>
        </Reveal>
      ) : null}

      {runState === "done" ? (
        <Reveal>
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
                  Slow and effortful, and it needs raw material: facts to gather, then reason
                  over.
                </p>
              </div>
            </div>

            <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
              <strong>&ldquo;Who won?&rdquo; looks like a System 1 question.</strong> A fixed
              fact, a one-shelf lookup
              {humanPick !== null ? (
                <>, and that is exactly how you answered it</>
              ) : null}
              . But the fact is <em>too new</em>: the machine&apos;s shelf was stocked in early
              2025, the final is not on it, and the pop came up empty. That forced the slow road,
              and the slow road starved. System 2 works by looking facts up and reasoning over
              them; with no web search there was nothing to look up, so there was nothing to
              reason <em>about</em>.{" "}
              <strong>When the fact is missing, no amount of thinking manufactures it.</strong>{" "}
              The honest move was the one you watched: say so.
            </div>

            <div className="max-w-2xl rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
              <strong>The trap is the other outcome.</strong> A machine that skips the admission
              and simply names a winner: instant, fluent, and hollow. That is System 1 firing
              with an empty shelf, a guess wearing certainty&apos;s clothes. The questions that
              look easiest, the plain lookups, are exactly where it fails silently.
            </div>

            <p className="max-w-2xl text-ink">
              <em>
                Which leaves one question standing. The machine failed because the final never
                reached its memory. So: what if it had? What if the model had been trained on
                data that includes that night? What that takes, and what it costs, is the next
                page.
              </em>
            </p>

            <p className="text-xs text-ink-muted">
              the question is real and recent on purpose · the answer key is an authored
              placeholder; verify the winner before shipping · the machine&apos;s reply is an
              authored example of the ideal honest failure; a live open model with no web search
              replaces it later · framing: Kahneman, <em>Thinking, Fast and Slow</em>
            </p>
          </section>
        </Reveal>
      ) : null}

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
