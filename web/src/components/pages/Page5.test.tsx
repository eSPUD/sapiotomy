import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so "Show your work" lands the whole chain at
// once (no timers). The animated block below flips it OFF to cover the
// step-by-step streaming.
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

import { Page5 } from "./Page5";
import { COT_DEMO } from "@/lib/authored";

const D = COT_DEMO;

const workToggle = () => screen.getByRole("switch", { name: /show your work/i });
const ask = () => fireEvent.click(screen.getByRole("button", { name: /ask the model/i }));

describe("Page 5 (How to Reason)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows the question, the toggle, and the scaling panel up front; no answer yet", () => {
    render(<Page5 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How to Reason");
    expect(screen.getByText(D.question)).toBeInTheDocument();
    expect(workToggle()).toHaveAttribute("aria-checked", "false");
    // The flat-vs-steep chart is on from first paint, with both legends.
    expect(
      screen.getByRole("img", { name: /GSM8K solve rate for the PaLM family/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/standard prompting \(the blurt\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/chain-of-thought prompting/i).length).toBeGreaterThan(0);
    // Neither behaviour has run.
    expect(screen.queryByText(D.blurt)).toBeNull();
    expect(screen.queryByText(D.steps[0])).toBeNull();
    // The paper's headline numbers ride the caption.
    expect(screen.getAllByText(/\+39\.0/).length).toBeGreaterThan(0);
  });

  it("asking with the toggle off replays the wrong blurt", () => {
    render(<Page5 />);
    ask();
    expect(screen.getByText(D.blurt)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`it is ${D.blurtNumber}, not\\s+${D.answerNumber}`))).toBeInTheDocument();
    expect(screen.queryByText(D.steps[0])).toBeNull();
  });

  it("flipping the toggle on after asking walks the quoted chain to 9", () => {
    render(<Page5 />);
    ask();
    fireEvent.click(workToggle());
    for (const step of D.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByText(new RegExp(`✓\\s*${D.answer}`))).toBeInTheDocument();
    // Flipping back swaps the panel to the blurt again (no stale chain).
    fireEvent.click(workToggle());
    expect(screen.getByText(D.blurt)).toBeInTheDocument();
    expect(screen.queryByText(D.steps[0])).toBeNull();
  });

  it("asking with the toggle on goes straight to the chain (reduced motion: whole chain)", () => {
    render(<Page5 />);
    fireEvent.click(workToggle());
    ask();
    for (const step of D.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByText(new RegExp(`✓\\s*${D.answer}`))).toBeInTheDocument();
  });

  it("the honesty note and citations are on the page", () => {
    render(<Page5 />);
    expect(screen.getByText(/at 8B the chain/i)).toBeInTheDocument();
    expect(screen.getByText(/emergent/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Wei et al. 2022/).length).toBeGreaterThan(0);
    expect(screen.getByText(/quoted from\s+Figure 1/i)).toBeInTheDocument();
  });
});

// The animated path: reduced motion OFF, fake timers; the chain streams one
// step at a time and lands exactly once.
describe("Page 5 animated chain (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("streams the chain step by step to the landing", () => {
    render(<Page5 />);
    fireEvent.click(workToggle());
    ask();
    // Before any timer fires: thinking cursor, no first step yet.
    expect(screen.queryByText(D.steps[0])).toBeNull();
    expect(screen.getByText(/thinking on the page/i)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(700 + 20);
    });
    expect(screen.getByText(D.steps[0])).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(`✓\\s*${D.answer}`))).toBeNull();
    // Play out the rest.
    for (let i = 1; i < D.steps.length; i++) {
      act(() => {
        vi.advanceTimersByTime(700 + 20);
      });
    }
    expect(screen.getByText(new RegExp(`✓\\s*${D.answer}`))).toBeInTheDocument();
  });
});
