"use client";

/**
 * Page 2, "Two Systems" (docs/page_2_refactor.md). One question: who won the
 * FIFA 2026 World Cup? The reader answers (or passes the question to the
 * machine), then runs a machine whose memory predates the final on the same
 * question with no web search. Its honest failure names the two systems: the
 * question looks like a System 1 lookup, but a fact that never reached the
 * machine forces System 2, and System 2 starves with nothing to look up. The
 * training question is only the closing teaser; no inference talk here.
 *
 * Layout rule (revision, 2026-07): no pop-ups, no reveals. Both cards and the
 * whole analysis are on screen from the first paint, side by side; steps the
 * reader has not reached yet are grayed out, never hidden.
 */

import { useEffect, useMemo, useState } from "react";
import { PageNav } from "@/components/PageNav";
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
        ? `${WC.options[i]}: right, and it took zero steps. The machine's run button is unlocked.`
        : `You said ${WC.options[i]}; the recorded winner here is ${winner}. The machine's run button is unlocked.`,
    );
  };

  const passToMachine = () => {
    if (locked) return;
    recordInteraction(PAGE_N);
    setOverrode(true);
    setAnnouncement("You passed the question to the machine. Press run to watch it try.");
  };

  const onRun = async () => {
    if (!locked || runState !== "idle") return;
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
    `rounded border px-4 py-2.5 text-center text-sm disabled:opacity-50 ${
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
        No arithmetic this time. The <strong>2026 World Cup</strong> final has been played; four
        names, one lifted the cup. You answer first, then the machine takes the same question.
      </p>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section aria-label="The question" className="overflow-hidden rounded-lg border border-grid bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-grid px-4 py-2 text-xs text-ink-muted">
            <span>your turn · one question · four names</span>
            <span className="rounded-full border border-wrong/60 bg-wrong/15 px-2 py-0.5 text-wrong">
              answer key: authored placeholder · verify before shipping
            </span>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <p className="text-lg text-ink">{WC.question}</p>
            <div role="group" aria-label="The four names" className="grid gap-2 sm:grid-cols-2">
              {WC.options.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={humanPick === i}
                  disabled={locked && humanPick !== i}
                  onClick={() => pick(i)}
                  className={optionClass(humanPick === i)}
                >
                  {name}
                  {humanPick === i ? <span aria-hidden="true"> ✓</span> : null}
                </button>
              ))}
            </div>

            {humanPick !== null ? (
              <p className="text-ink">
                {pickedRight ? (
                  <>
                    <span className="text-correct">✓ {winner}.</span>{" "}
                    <span className="text-ink-muted">
                      No steps, no scratch work — the name was simply <em>there</em>, the way 4 is
                      there for 2 + 2. A watched final files itself.
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-wrong">✗ You said {WC.options[humanPick]};</span>{" "}
                    <span className="text-ink-muted">
                      the record says <strong className="text-ink">{winner}</strong>. Nothing to{" "}
                      <em>work out</em> either: a result you never saw cannot be derived, only
                      remembered.
                    </span>
                  </>
                )}
              </p>
            ) : null}

            {overrode ? (
              <p className="text-ink">
                Fair enough — you passed. Nothing to figure out; the night is either filed in
                memory or gone. Now watch the machine in that exact spot.
              </p>
            ) : humanPick === null ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-ink-muted">or skip yourself entirely:</span>
                <button
                  type="button"
                  onClick={passToMachine}
                  className="rounded border border-grid bg-surface-raised px-4 py-2 text-sm text-ink"
                >
                  Don&apos;t answer. Let the machine take it ▸
                </button>
              </div>
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
              Same question. But its memory was sealed <strong className="text-ink">early 2025</strong>,
              months before this final, and it has <strong className="text-ink">no web search</strong>.
            </p>
            <p className="mt-1 font-mono text-xs uppercase tracking-wide text-ink-muted">you →</p>
            <p className="text-ink">
              {WC.question} {WC.options.join(", ")}?
            </p>
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
              Slow and effortful, and it needs raw material: facts to gather, then reason
              over.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-3 lg:grid-cols-2">
          <div className="rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
            <strong>Looks like a System 1 question.</strong> Some questions should just pop
            {humanPick !== null ? <>, and that is exactly how you answered it</> : null}. But
            this fact is so recent the model was never trained on it — so nothing pops.
          </div>

          <div className="rounded-lg border-l-4 border-wrong bg-wrong/15 p-4 text-ink">
            <strong>The trap:</strong> a model that hides the gap and names a winner anyway —
            instant, fluent, hollow. A guess wearing certainty&apos;s clothes.
          </div>
        </div>

        <p className="max-w-2xl text-ink">
          <em>
            The machine failed because the final never reached its memory. So what is the
            solution? What if the model <strong>were trained on data that includes that
            night</strong>, recent as it is? That is the next page.
          </em>
        </p>

        <p className="text-xs text-ink-muted">
          the question is real and recent on purpose · the answer key is an authored
          placeholder; verify the winner before shipping · the machine&apos;s reply is an
          authored example of the ideal honest failure; a live open model with no web search
          replaces it later · framing: Kahneman, <em>Thinking, Fast and Slow</em>
        </p>
      </section>

      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <PageNav n={PAGE_N} />
    </article>
  );
}
