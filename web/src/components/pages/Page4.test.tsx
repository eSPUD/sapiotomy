import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so "Let it think" reveals the whole trace at
// once (no timers to advance). The animated block below flips it OFF to cover
// the step-by-step streaming.
let reducedMotion = true;
const mm = (q: string) => ({
  matches: reducedMotion && q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page4 } from "./Page4";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";

const WC = SPAIN_WORLD_CUPS;

const instant = () => fireEvent.click(screen.getByRole("button", { name: /answer instantly/i }));
const think = () => fireEvent.click(screen.getByRole("button", { name: /let it think/i }));

describe("Page 4 (The Third Option)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("opens on the choice, having replayed neither behaviour yet", () => {
    render(<Page4 />);
    expect(screen.getByRole("heading", { name: /The Third Option/i })).toBeInTheDocument();
    // The same question as page 2 is on screen.
    expect(screen.getByText(WC.question)).toBeInTheDocument();
    // Neither the blurt nor the trace has been shown.
    expect(screen.queryByText(WC.machine.reply.join(" "))).toBeNull();
    expect(screen.queryByText(WC.thinking.steps[0])).toBeNull();
  });

  it("instant mode replays page 2's wrong blurt in a single pass", () => {
    render(<Page4 />);
    instant();
    // The blurt itself — which the authored guard proves omits the newest title.
    expect(screen.getByText(WC.machine.reply.join(" "))).toBeInTheDocument();
    // The verdict names the one-short miss.
    expect(screen.getByText(new RegExp(`✗\\s*${WC.machine.answer}`))).toBeInTheDocument();
  });

  it("thinking mode recognizes the gap, checks, and lands the true count", () => {
    render(<Page4 />);
    think();
    // The whole trace is present (reduced motion), and it names the 2026 title
    // the blurt omitted — recognition, not invention.
    for (const step of WC.thinking.steps) {
      expect(screen.getByText(new RegExp(step.slice(0, 24)))).toBeInTheDocument();
    }
    expect(document.body.textContent ?? "").toContain(String(WC.latestYear));
    // The verdict lands on the true count.
    expect(
      screen.getByText(new RegExp(`✓\\s*${WC.thinking.answer.replace(/\.$/, "")}`)),
    ).toBeInTheDocument();
  });

  it("names inference-time scaling here — the Act 1 payoff — and previews the toolbox", () => {
    render(<Page4 />);
    // Named on this page (the callout and the footer both carry it).
    expect(screen.getAllByText(/inference-time scaling/i).length).toBeGreaterThan(0);
    // The honest note: thinking recognizes the gap, it does not invent the fact.
    expect(screen.getByText(/cannot invent a fact the model never saw/i)).toBeInTheDocument();
    // Sets up Act 2: sample/vote, generate/verify, search.
    expect(screen.getByText(/how should it spend it/i)).toBeInTheDocument();
  });

  it("toggling between modes swaps the panel (no stale trace left behind)", () => {
    render(<Page4 />);
    think();
    expect(screen.getByText(new RegExp(WC.thinking.steps[0].slice(0, 24)))).toBeInTheDocument();
    instant();
    expect(screen.queryByText(new RegExp(WC.thinking.steps[0].slice(0, 24)))).toBeNull();
    expect(screen.getByText(WC.machine.reply.join(" "))).toBeInTheDocument();
  });

  it("streams the trace step by step when motion is allowed", () => {
    reducedMotion = false;
    vi.useFakeTimers();
    try {
      render(<Page4 />);
      think();
      // Before any timer fires, no step is visible yet.
      expect(screen.queryByText(new RegExp(WC.thinking.steps[0].slice(0, 24)))).toBeNull();
      act(() => {
        vi.advanceTimersByTime(750 * (WC.thinking.steps.length + 1));
      });
      expect(screen.getByText(new RegExp(WC.thinking.steps[0].slice(0, 24)))).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(WC.thinking.answer.replace(/\.$/, ""))),
      ).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  afterEach(() => {
    reducedMotion = true;
  });
});
