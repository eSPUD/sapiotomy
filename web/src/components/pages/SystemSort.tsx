"use client";

import { useEffect, useRef, useState } from "react";
import { SORTING_ITEMS, type SortItem } from "@/lib/authored";
import { useStore } from "@/store/useStore";

const SLOW_TOTAL = SORTING_ITEMS.filter((x) => x.system === "slow").length;

type LogLine = { tone: "idle" | "right" | "wrong" | "done" | "note"; text: string };
const START: LogLine = { tone: "idle", text: "pick a task to see whether it needs System 2" };

/**
 * Pick the System 2 tasks out of nine everyday ones. The reader only clicks.
 * Every box starts gray; a System 2 task turns brown (the accent) and a System 1
 * task turns dark gray, each marked with its system, so every click teaches and
 * nothing is retried.
 * The reader is never told how many System 2 tasks there are (no counter):
 * deciding when you are done is part of the exercise. The reward lands when
 * every System 2 task is found.
 */
export function SystemSort() {
  const recordInteraction = useStore((s) => s.recordInteraction);
  // The tasks are shuffled once per visit. They start in the authored order:
  // randomising during render would make the server and client markup differ and
  // trip hydration, so the shuffle waits for the effect.
  const [order, setOrder] = useState<readonly SortItem[]>(SORTING_ITEMS);
  useEffect(() => {
    setOrder((items) => {
      const next = [...items];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  }, []);

  const [picked, setPicked] = useState<Record<string, true>>({});
  // The output console under the grid, set as a terminal: a running log of every
  // pick, newest at the bottom. It is the live region, so each line is read out.
  const [log, setLog] = useState<LogLine[]>([START]);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log]);

  const found = SORTING_ITEMS.filter((x) => x.system === "slow" && picked[x.id]).length;
  const done = found === SLOW_TOTAL;

  // Start over: clear every pick and reshuffle, so a second try is a fresh grid.
  // Always available, even before a pick (it then just reshuffles the tasks).
  const reset = () => {
    setPicked({});
    setOrder((items) => {
      const next = [...items];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
    setLog([START]);
  };

  const pick = (item: SortItem) => {
    if (picked[item.id] || done) return;
    recordInteraction(1);
    setPicked((p) => ({ ...p, [item.id]: true }));
    const right = item.system === "slow";
    setLog((l) => {
      const next: LogLine[] = [
        ...l,
        right
          ? { tone: "right", text: `${item.text} → System 2 ✓` }
          : { tone: "wrong", text: `${item.text} → System 1, not this one` },
      ];
      if (right && found + 1 === SLOW_TOTAL) {
        next.push(
          { tone: "done", text: "That is every System 2 task." },
          { tone: "note", text: "You just ran System 2 to tell System 1 from System 2." },
        );
      }
      return next;
    });
  };

  return (
    <section aria-label="Pick the System 2 tasks" className="flex flex-col gap-4">
      <p className="text-ink">
        Click every task that needs <strong>System 2</strong>, the slow, deliberate one.
      </p>

      {/* The grid and its output console share one box. */}
      <div className="flex flex-col gap-3 rounded-xl border border-grid p-2.5 sm:p-4">
        {/* Three rows of three (two columns on a phone). Every box is the same
          height: auto-rows-fr sizes all rows to the tallest, and the minimum height
          already has room for a picked box's label line, so a pick never changes
          the grid. Text sits centred, with the label joining it under it. */}
        <div className="grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {order.map((x) => {
            const isPicked = !!picked[x.id];
            const right = isPicked && x.system === "slow";
            // Once every System 2 task is found, the System 1 tasks show their colour
            // too, picked or not, so the finished grid is the full answer.
            const missed = (isPicked || done) && x.system === "fast";
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => pick(x)}
                disabled={isPicked || done}
                aria-pressed={isPicked}
                className={`relative flex h-full min-h-[6rem] flex-col items-center justify-center rounded-lg border px-6 py-2 sm:px-8 text-center text-sm transition-colors sm:min-h-[4.75rem] ${
                  right
                    ? "border-compute bg-compute text-ink"
                    : missed
                      ? "border-ink-muted bg-ink-muted text-canvas"
                      : "border-grid bg-surface-raised text-ink hover:border-ink-faint hover:bg-grid"
                }`}
              >
                {/* A right pick carries a check in a circle at its top-left corner. */}
                {right ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-canvas text-[10px] font-bold text-compute-ink sm:left-2 sm:top-2 sm:h-5 sm:w-5 sm:text-xs"
                  >
                    ✓
                  </span>
                ) : null}
                <span>{x.text}</span>
                {right ? <span className="text-xs">System 2</span> : null}
                {missed ? <span className="text-xs">System 1</span> : null}
              </button>
            );
          })}
        </div>

        {/* Output console, terminal style: a dark pane, monospace, one log line per
            pick. A fixed height that scrolls to the newest line, so the box never
            jumps as the log grows. */}
        {/* The log role sits on the scrolling pane, not the list, so the list keeps
            its list semantics; tabIndex lets keyboard users scroll it. */}
        <div
          ref={logRef}
          role="log"
          aria-live="polite"
          aria-label="Output console"
          tabIndex={0}
          className="h-28 overflow-y-auto rounded-lg bg-ink px-4 py-3 font-code text-xs leading-relaxed"
        >
          <ol>
            {log.map((l, i) => (
              <li
                key={i}
                // The prompt keeps its own column, so a wrapped line hangs under the text.
                className={`flex gap-2 ${
                  l.tone === "right"
                    ? "text-size-1"
                    : l.tone === "done"
                      ? "font-bold text-size-1"
                      : l.tone === "wrong" || l.tone === "note"
                        ? "text-canvas"
                        : "text-canvas/60"
                }`}
              >
                <span aria-hidden="true" className="shrink-0 text-canvas/40">
                  {l.tone === "idle" ? "$" : "›"}
                </span>
                <span className="min-w-0">{l.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Reset on the left, as in section 1's widget; the colour key on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <button
          type="button"
          onClick={reset}
          aria-label="Reset picks"
          title="Reset picks: start over with a fresh grid"
          className="rounded bg-grid px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink-faint hover:text-canvas"
        >
          Reset
        </button>
        {/* What each colour means, in the boxes' own fills. */}
        <ul
          aria-label="Colour key"
          className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-ink-muted"
        >
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border border-compute bg-compute"
            />
            System 2
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-3 w-3 rounded-sm border border-ink-muted bg-ink-muted"
            />
            System 1
          </li>
        </ul>
      </div>
    </section>
  );
}
