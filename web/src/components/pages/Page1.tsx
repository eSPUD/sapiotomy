"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { PageNav } from "@/components/PageNav";
import { ACTS, getPage } from "@/lib/pages";
import { COMPUTER_SCRIPT, GAME_ROUNDS } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const PAGE_N = 1;

type Mode = "you" | "cpu";
type RoundStatus = "right" | "wrong" | "gaveup";
type PopChoice = "pop" | "reason";

/**
 * Wall-clock milliseconds each computer round occupies ON SCREEN. The
 * displayed clock runs from COMPUTER_SCRIPT seconds (illustrative pacing);
 * when the screen time is shorter, the round is time-compressed behind the
 * "fast forward" chip so displayed times never contradict watched time.
 */
const CPU_SCREEN_MS = [1200, 3800, 5200];
const TYPE_MS = 700;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Tolerant answer parsing: trim, commas, spaces, leading =, trailing period. */
function parseAnswer(raw: string): number {
  let s = raw.trim();
  if (s.startsWith("=")) s = s.slice(1);
  if (s.endsWith(".")) s = s.slice(0, -1);
  s = s.replace(/[\s,]/g, "");
  return /^-?\d+$/.test(s) ? parseInt(s, 10) : NaN;
}

function fmt(ms: number): string {
  const s = ms / 1000;
  if (s < 59.95) return `${s.toFixed(1)} s`;
  const t = Math.round(s);
  return `${Math.floor(t / 60)} m ${t % 60} s`;
}

function ChoiceButton({
  selected,
  disabled = false,
  onClick,
  children,
}: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`rounded border px-4 py-2 text-sm text-ink disabled:opacity-50 ${
        selected ? "border-compute bg-compute/40 font-semibold" : "border-grid bg-surface-raised"
      }`}
    >
      {selected ? <span aria-hidden="true">✓ </span> : null}
      {children}
    </button>
  );
}

interface RoundCardProps {
  index: number;
  promptSuffix?: string;
  hint?: string;
  value: string;
  watchMs: number;
  ff: boolean;
  /** The round has not opened yet: fully visible, but grayed and inert. */
  locked: boolean;
  readOnly: boolean;
  submitDisabled: boolean;
  onChange: (v: string) => void;
  onFocus: () => void;
  onSubmit: () => void;
  extra?: ReactNode;
  followup?: ReactNode;
}

function RoundCard(props: RoundCardProps) {
  const round = GAME_ROUNDS[props.index];
  return (
    <section
      aria-label={`Round ${props.index + 1}`}
      className={`rounded-lg border bg-surface p-4 ${
        props.locked ? "border-dashed border-grid" : "border-grid"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Round {props.index + 1}</p>
      <p className="mt-1 text-lg text-ink">
        What&apos;s <strong className="font-mono">{round.prompt}</strong>?
        {props.promptSuffix ? ` ${props.promptSuffix}` : ""}
      </p>
      <form
        className="mt-3 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSubmit();
        }}
      >
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          aria-label={`Your answer to ${round.prompt}`}
          value={props.value}
          disabled={props.locked}
          readOnly={props.readOnly}
          onChange={(e) => props.onChange(e.target.value)}
          onFocus={props.onFocus}
          className={`w-28 rounded border border-grid px-3 py-2 font-mono text-ink disabled:opacity-50 ${
            props.locked || props.readOnly ? "bg-surface-raised" : "bg-canvas"
          }`}
        />
        <button
          type="submit"
          disabled={props.locked || props.submitDisabled}
          className="rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
        >
          Answer
        </button>
        <span
          role="timer"
          aria-label={`round ${props.index + 1} stopwatch`}
          className="rounded-full border border-grid px-2.5 py-0.5 font-mono text-xs tabular-nums text-ink-muted"
        >
          {fmt(props.watchMs)}
        </span>
        {props.ff ? (
          <span className="rounded-full border border-compute px-2 py-0.5 font-mono text-xs text-compute">
            ≫ fast forward
          </span>
        ) : null}
      </form>
      {props.hint ? <p className="mt-2 text-sm text-ink-muted">{props.hint}</p> : null}
      {props.extra}
      {props.followup ? <p className="mt-3 text-ink">{props.followup}</p> : null}
    </section>
  );
}

export function Page1() {
  const page = getPage(PAGE_N)!;
  const recordInteraction = useStore((s) => s.recordInteraction);
  const [reduced] = useState(() => prefersReducedMotion());

  const [mode, setMode] = useState<Mode>("you");
  const [cur, setCur] = useState(0);
  const [times, setTimes] = useState<(number | null)[]>([null, null, null]);
  const [statuses, setStatuses] = useState<(RoundStatus | null)[]>([null, null, null]);
  const [values, setValues] = useState<string[]>(["", "", ""]);
  const [watch, setWatch] = useState<number[]>([0, 0, 0]);
  const [popChoice, setPopChoice] = useState<PopChoice | null>(null);
  const [ff, setFf] = useState(false);
  const [cpuStep, setCpuStep] = useState(0);
  const [announce, setAnnounce] = useState("");

  const armedAtRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runIdRef = useRef(0);
  const pendingRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const doneAll = statuses[2] != null;
  /** Every round is on screen from the start; a round unlocks in order. */
  const unlocked = (i: number) => i === 0 || statuses[i - 1] != null;

  /** Schedule work that dies with the current run (mode switch, run again). */
  function later(fn: () => void, ms: number) {
    const id = runIdRef.current;
    const h = setTimeout(() => {
      if (id === runIdRef.current) fn();
    }, ms);
    pendingRef.current.push(h);
  }

  function setAt<T>(setter: (f: (prev: T[]) => T[]) => void, i: number, v: T) {
    setter((prev) => prev.map((x, k) => (k === i ? v : x)));
  }

  useEffect(
    () => () => {
      runIdRef.current += 1;
      pendingRef.current.forEach(clearTimeout);
      if (tickRef.current) clearInterval(tickRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!doneAll) return;
    setAnnounce(
      `Results are in: ${GAME_ROUNDS.map((r, i) => `${r.prompt} took ${fmt(times[i] ?? 0)}`).join(", ")}.`,
    );
  }, [doneAll, times]);

  function stopClock(): number {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    const t = armedAtRef.current == null ? 0 : performance.now() - armedAtRef.current;
    armedAtRef.current = null;
    return t;
  }

  /** The per-round clock starts when the reader focuses the answer box. */
  function armClock(i: number) {
    if (mode !== "you" || !unlocked(i) || statuses[i] != null || armedAtRef.current != null) return;
    armedAtRef.current = performance.now();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(
      () => {
        if (armedAtRef.current != null) {
          setAt(setWatch, i, performance.now() - armedAtRef.current);
        }
      },
      reduced ? 1000 : 100,
    );
  }

  function finishRound(i: number, st: RoundStatus, t: number) {
    setAt(setTimes, i, t as number | null);
    setAt(setStatuses, i, st as RoundStatus | null);
    setAt(setWatch, i, t);
    if (i < 2) setCur(i + 1);
  }

  function submit(i: number) {
    if (mode !== "you" || !unlocked(i) || statuses[i] != null) return;
    const v = parseAnswer(values[i]);
    if (Number.isNaN(v)) return;
    recordInteraction(PAGE_N);
    const t = stopClock();
    finishRound(i, v === GAME_ROUNDS[i].answer ? "right" : "wrong", t);
    if (i === 0) setAnnounce("Round 2 is unlocked: what's 17 times 24?");
    if (i === 1) setAnnounce("Round 3 is unlocked, and the reflection question is open.");
  }

  function giveUp() {
    if (mode !== "you" || !unlocked(2) || statuses[2] != null) return;
    recordInteraction(PAGE_N);
    finishRound(2, "gaveup", stopClock());
  }

  /** The pick is final: first choice locks (the results echo depends on it). */
  function pickPop(choice: PopChoice) {
    if (mode !== "you" || statuses[1] == null || popChoice != null) return;
    recordInteraction(PAGE_N);
    setPopChoice(choice);
  }

  /* ---- computer mode: a hand-scripted playthrough, not a measurement ---- */

  function cpuRound(i: number, done?: () => void) {
    setCur(i);
    const move = COMPUTER_SCRIPT[i];
    const simT = move.seconds * 1000;
    const screenMs = CPU_SCREEN_MS[i];
    if (screenMs < simT) setFf(true);
    const t0 = performance.now();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / screenMs);
      setAt(setWatch, i, p * simT);
    }, 80);
    const typed = move.typed;
    const typeStart = Math.max(0, screenMs - TYPE_MS);
    typed.split("").forEach((_, k) => {
      later(() => setAt(setValues, i, typed.slice(0, k + 1)), typeStart + (TYPE_MS / typed.length) * (k + 1));
    });
    later(() => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setFf(false);
      setAnnounce(`The computer answered ${GAME_ROUNDS[i].prompt} in ${fmt(simT)}.`);
      finishRound(i, "right", simT);
      if (done) done();
    }, screenMs + 60);
  }

  function startCpuAuto() {
    cpuRound(0, () => {
      later(
        () =>
          cpuRound(1, () => {
            later(() => setPopChoice("reason"), 1100);
            later(() => cpuRound(2), 2400);
          }),
        600,
      );
    });
  }

  /** Reduced motion: the computer plays in discrete steps, one per press. */
  function stepCpu() {
    recordInteraction(PAGE_N);
    const next = cpuStep + 1;
    setCpuStep(next);
    const fill = (i: number) => {
      setAt(setValues, i, COMPUTER_SCRIPT[i].typed);
      finishRound(i, "right", COMPUTER_SCRIPT[i].seconds * 1000);
    };
    if (next === 1) fill(0);
    if (next === 2) {
      fill(1);
      setPopChoice("reason");
    }
    if (next === 3) fill(2);
  }

  /** Switching modes (either direction) or "Run it again" fully resets. */
  function resetTo(nextMode: Mode) {
    recordInteraction(PAGE_N);
    runIdRef.current += 1;
    pendingRef.current.forEach(clearTimeout);
    pendingRef.current = [];
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    armedAtRef.current = null;
    setMode(nextMode);
    setCur(0);
    setTimes([null, null, null]);
    setStatuses([null, null, null]);
    setValues(["", "", ""]);
    setWatch([0, 0, 0]);
    setPopChoice(null);
    setFf(false);
    setCpuStep(0);
    setAnnounce("");
    if (nextMode === "cpu" && !reduced) startCpuAuto();
  }

  /* ---- derived copy ---- */

  function followup(i: number): ReactNode {
    const st = statuses[i];
    if (st == null) return undefined;
    const d = GAME_ROUNDS[i].display;
    if (i === 0) {
      return st === "right" ? (
        <>
          <strong>{d}.</strong> It was there before you decided to think.
        </>
      ) : (
        <>
          It&apos;s <strong>{d}</strong>. We&apos;ll call that a typo and move on.
        </>
      );
    }
    if (i === 1) {
      return st === "right" ? (
        <>
          <strong>{d}.</strong> Notice the clock this time.
        </>
      ) : (
        <>
          It&apos;s <strong>{d}</strong>. No matter: it&apos;s the clock we&apos;re after, not the score.
        </>
      );
    }
    if (st === "right") {
      return (
        <>
          <strong>{d}.</strong> Look at the clock.
        </>
      );
    }
    if (st === "wrong") {
      return (
        <>
          It&apos;s <strong>{d}</strong>. Somewhere in those steps a digit slipped; that&apos;s what juggling
          that many digits in your head does.
        </>
      );
    }
    return (
      <>
        It&apos;s <strong>{d}</strong>. Your clock read{" "}
        <strong className="font-mono">{fmt(times[2] ?? 0)}</strong> when you stopped. That pause is the point.
      </>
    );
  }

  const maxT = Math.max(...times.map((t) => t ?? 0), 1);
  const barsLabel = `Time per round: ${GAME_ROUNDS.map((r, i) =>
    times[i] == null
      ? `${r.prompt} not yet answered`
      : `${r.prompt} took ${fmt(times[i] ?? 0)}${statuses[i] === "gaveup" ? " before giving up" : ""}`,
  ).join(", ")}.`;
  const anyMissed = statuses.some((st) => st != null && st !== "right");
  const roundActive = (i: number) => cur === i && statuses[i] == null;
  const reflectionOpen = statuses[1] != null;

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
        Your mind has two gears. This little game finds both: three questions, a timer on each, and a
        comparison at the end. Each round unlocks the next; grayed rounds are waiting, not hidden.
      </p>

      <div className="rounded-lg border border-grid bg-surface p-4">
        <h2 id="who-plays" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Who plays?
        </h2>
        <div role="group" aria-labelledby="who-plays" className="mt-2 flex flex-wrap items-center gap-2">
          <ChoiceButton selected={mode === "you"} onClick={() => resetTo("you")}>
            You
          </ChoiceButton>
          <ChoiceButton selected={mode === "cpu"} onClick={() => resetTo("cpu")}>
            The computer
          </ChoiceButton>
          <span className="text-sm text-ink-muted">Pick the computer and it plays the round for you.</span>
        </div>
        {mode === "cpu" ? (
          <p className="mt-3 max-w-2xl text-sm text-ink-muted">
            The computer&apos;s play is a hand-scripted simulation of a human player with illustrative
            pacing, not a measurement. Long rounds are time-compressed on screen; the ≫ chip means the
            clock is running faster than real time.
          </p>
        ) : null}
      </div>

      {mode === "cpu" && reduced && cpuStep < 3 ? (
        <section aria-label="Computer playthrough steps" className="rounded-lg border border-grid bg-surface p-4">
          <p className="text-sm text-ink-muted">Reduced motion is on, so the computer plays step by step.</p>
          <button
            type="button"
            onClick={stepCpu}
            className="mt-2 rounded bg-compute px-4 py-2 text-sm font-semibold text-canvas disabled:opacity-50"
          >
            Next ▸
          </button>
        </section>
      ) : null}

      <div className="flex flex-col gap-4">
        <RoundCard
          index={0}
          hint="The clock starts when you click into the box."
          value={values[0]}
          watchMs={watch[0]}
          ff={mode === "cpu" && ff && roundActive(0)}
          locked={false}
          readOnly={mode === "cpu" || statuses[0] != null}
          submitDisabled={mode !== "you" || statuses[0] != null}
          onChange={(v) => setAt(setValues, 0, v)}
          onFocus={() => armClock(0)}
          onSubmit={() => submit(0)}
          followup={followup(0)}
        />
        <RoundCard
          index={1}
          promptSuffix="In your head, no calculator."
          hint={unlocked(1) ? undefined : "Unlocks after round 1."}
          value={values[1]}
          watchMs={watch[1]}
          ff={mode === "cpu" && ff && roundActive(1)}
          locked={!unlocked(1)}
          readOnly={mode === "cpu" || statuses[1] != null}
          submitDisabled={mode !== "you" || statuses[1] != null}
          onChange={(v) => setAt(setValues, 1, v)}
          onFocus={() => armClock(1)}
          onSubmit={() => submit(1)}
          followup={followup(1)}
        />
        <RoundCard
          index={2}
          promptSuffix="Same rules. Just bigger."
          hint={unlocked(2) ? undefined : "Unlocks after round 2."}
          value={values[2]}
          watchMs={watch[2]}
          ff={mode === "cpu" && ff && roundActive(2)}
          locked={!unlocked(2)}
          readOnly={mode === "cpu" || statuses[2] != null}
          submitDisabled={mode !== "you" || statuses[2] != null}
          onChange={(v) => setAt(setValues, 2, v)}
          onFocus={() => armClock(2)}
          onSubmit={() => submit(2)}
          extra={
            mode === "you" && statuses[2] == null ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={giveUp}
                  disabled={!unlocked(2)}
                  className="text-sm text-compute underline underline-offset-2 disabled:opacity-50"
                >
                  I give up, show me
                </button>
              </div>
            ) : null
          }
          followup={followup(2)}
        />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section
          aria-label="How did you think about it?"
          className="rounded-lg border-l-4 border-compute bg-surface p-4"
        >
          <h2 className="text-lg font-semibold text-ink">How did you think about it?</h2>
          <p className="mt-1 text-ink-muted">
            After round 2 ({GAME_ROUNDS[1].prompt}): did the answer just pop into your head, or did you
            have to reason through it?
            {reflectionOpen ? null : " Answer round 2 first; the buttons unlock then."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ChoiceButton
              selected={popChoice === "pop"}
              disabled={mode !== "you" || !reflectionOpen || popChoice != null}
              onClick={() => pickPop("pop")}
            >
              It just popped in
            </ChoiceButton>
            <ChoiceButton
              selected={popChoice === "reason"}
              disabled={mode !== "you" || !reflectionOpen || popChoice != null}
              onClick={() => pickPop("reason")}
            >
              I reasoned through it
            </ChoiceButton>
          </div>
          {popChoice != null ? (
            <p className="mt-3 text-ink">
              Noted. Keep that feeling in mind as the rounds get bigger.
            </p>
          ) : null}
        </section>

        <section aria-label="Results" className="rounded-lg border border-grid bg-surface p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Three questions, three times
          </h2>
          <div role="img" aria-label={barsLabel} className="mt-3">
            <div aria-hidden="true" className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2">
              {GAME_ROUNDS.map((r, i) => {
                const t = times[i] ?? 0;
                return (
                  <Fragment key={r.prompt}>
                    <span className="font-mono text-sm text-ink">{r.prompt}</span>
                    <span className="min-w-[60px]">
                      <span
                        className="block h-4 rounded bg-compute"
                        style={{ width: `${Math.max(2, Math.round((t / maxT) * 100))}%` }}
                      />
                    </span>
                    <span className="font-mono text-sm tabular-nums text-ink">
                      {times[i] == null
                        ? "–"
                        : `${fmt(t)}${
                            statuses[i] === "gaveup" ? " (gave up)" : statuses[i] === "wrong" ? " (missed)" : ""
                          }`}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {doneAll
              ? anyMissed
                ? `For the record: ${GAME_ROUNDS.map((r) => `${r.prompt} = ${r.display}`).join(" · ")}`
                : "All three right."
              : "The bars fill in as each round is answered."}
          </p>
        </section>
      </div>

      <div className="max-w-2xl rounded-lg border-l-4 border-compute bg-surface p-4 text-ink">
        {mode === "cpu" ? (
          <>
            That is how a person plays: <strong>instant, then seconds, then minutes.</strong> Same kind
            of question every round; what grew was the number of steps, and the clock followed. The
            size of the problem sets the thinking time.
          </>
        ) : (
          <>
            Same kind of question every round. What grows is the number of steps, and the clock
            follows. <strong>More steps, more time:</strong> the size of the problem sets the thinking
            time.
          </>
        )}
      </div>

      {mode === "you" && popChoice != null && doneAll ? (
        <p className="max-w-2xl text-ink">
          {popChoice === "pop"
            ? `And even for you, popping has limits: ${GAME_ROUNDS[1].display} may have popped in, but ${GAME_ROUNDS[2].display} pops in for nobody. Past a certain size, answers stop popping and start taking steps.`
            : `You felt the gear change at ${GAME_ROUNDS[1].prompt}. By ${GAME_ROUNDS[2].prompt} there was no choice left: only steps.`}
        </p>
      ) : null}

      <p className="max-w-2xl text-ink">
        <em>Next: a question where the size of the problem is not the problem at all.</em>
      </p>

      <div>
        <button
          type="button"
          onClick={() => resetTo(mode)}
          className="rounded bg-surface-raised px-3 py-1.5 text-sm text-ink"
        >
          Run it again
        </button>
      </div>

      <p className="text-xs text-ink-muted">
        framing: Kahneman, <em>Thinking, Fast and Slow</em> · the times above are from this play
        session; nothing here is a benchmark
      </p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      <PageNav n={PAGE_N} />
    </article>
  );
}
