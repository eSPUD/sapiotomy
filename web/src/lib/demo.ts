import { useEffect, useRef } from "react";

/**
 * Presentation (demo) mode: P steps through these stops in order; a P past the
 * last returns to the landing page and leaves the demo, and Q leaves at any stop.
 * Each stop is one widget, tagged in its page with a matching `data-demo`
 * attribute; DemoMode scrolls to it and spotlights it. A stop with a
 * `problem` also asks its widget to show that problem (1-based, as the widget's
 * own "problem 2 of 4" counts).
 */
export type DemoStop = {
  page: number;
  /** The `data-demo` value on the widget's container. */
  target: string;
  /** What the badge names the stop by: the section's heading. */
  title: string;
  problem?: number;
};

export const DEMO_STOPS: readonly DemoStop[] = [
  { page: 1, target: "p1-s2", title: "Which tasks need System 2?" },
  { page: 5, target: "p5-s2", title: "Zero-shot versus few-shot CoT prompting" },
  { page: 6, target: "p6-s2", title: "The same dial, every problem" },
  { page: 12, target: "p12-s2", title: "Which reasoning goes into the training set?", problem: 2 },
  { page: 13, target: "p13-s2", title: "Better answers, longer chains" },
  { page: 15, target: "p15-s1", title: "The whole toolbox, on one axis" },
];

const SELECT_EVENT = "demo:select";
type SelectDetail = { target: string; problem: number };

/**
 * The request a widget may not have been mounted in time to hear: kept here so a
 * widget that mounts after the event still picks it up once.
 */
let pending: SelectDetail | null = null;

/** Ask the widget tagged `target` to show `problem`. */
export function requestDemoSelect(target: string, problem: number): void {
  pending = { target, problem };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<SelectDetail>(SELECT_EVENT, { detail: pending }));
  }
}

/**
 * A widget's side of a stop's `problem`: call `onProblem` with the 1-based problem
 * the demo asks for, whether the request comes before or after the widget mounts.
 */
export function useDemoSelect(target: string, onProblem: (problem: number) => void): void {
  const handler = useRef(onProblem);
  handler.current = onProblem;
  useEffect(() => {
    const take = (d: SelectDetail | null) => {
      if (!d || d.target !== target) return;
      pending = null;
      handler.current(d.problem);
    };
    take(pending);
    const onEvent = (e: Event) => take((e as CustomEvent<SelectDetail>).detail);
    window.addEventListener(SELECT_EVENT, onEvent);
    return () => window.removeEventListener(SELECT_EVENT, onEvent);
  }, [target]);
}
