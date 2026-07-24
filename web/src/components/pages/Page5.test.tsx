import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so the chain steps deterministically via the
// Next button (Play is hidden under reduced motion). The animated block at the
// bottom flips it OFF to cover Play's step-by-step streaming.
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

const askBtn = () => screen.getByRole("button", { name: /ask the model/i });
const nextBtn = () => screen.getByRole("button", { name: /next ▸/i });
const exampleOne = () => screen.getByRole("button", { name: /^one$/i });
const exampleNone = () => screen.getByRole("button", { name: /^none$/i });

/** Walk the whole chain via Next presses (reduced motion → no Play). */
function walkChain() {
  for (let i = 0; i < D.steps.length; i++) fireEvent.click(nextBtn());
}

describe("Page 5 (How to Reason) — Stage A: teach by example", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows the question and the example lever up front; nothing asked yet", () => {
    render(<Page5 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How to Reason");
    expect(screen.getByText(D.question)).toBeInTheDocument();
    // The few-shot lever defaults to "none".
    expect(exampleNone()).toHaveAttribute("aria-pressed", "true");
    expect(exampleOne()).toHaveAttribute("aria-pressed", "false");
    // Neither behaviour has run.
    expect(screen.queryByText(D.blurt)).toBeNull();
    expect(screen.queryByText(D.steps[0])).toBeNull();
  });

  it("asking with no example blurts the wrong answer", () => {
    render(<Page5 />);
    fireEvent.click(askBtn());
    expect(screen.getByText(D.blurt)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`it is ${D.blurtNumber}, not ${D.answerNumber}`, "i")),
    ).toBeInTheDocument();
    expect(screen.queryByText(D.steps[0])).toBeNull();
  });

  it("adding the example then stepping walks the quoted chain to 9", () => {
    render(<Page5 />);
    fireEvent.click(exampleOne());
    fireEvent.click(askBtn());
    walkChain();
    for (const step of D.steps) expect(screen.getAllByText(step).length).toBeGreaterThan(0);
    // The landing shows in the surface, the narration, and the live region.
    expect(screen.getAllByText(new RegExp(`✓\\s*${D.answer}`)).length).toBeGreaterThan(0);
  });

  it("flipping the example off after asking swaps back to the blurt", () => {
    render(<Page5 />);
    fireEvent.click(exampleOne());
    fireEvent.click(askBtn());
    walkChain();
    fireEvent.click(exampleNone());
    expect(screen.getByText(D.blurt)).toBeInTheDocument();
    expect(screen.queryByText(D.steps[0])).toBeNull();
  });
});

describe("Page 5 — Stage B: predict then drive the scaling law", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("gates the scaling stage behind a prediction, then reveals the 8B emergence", () => {
    render(<Page5 />);
    // Predict-Observe: the scaling readouts are hidden until a guess is locked in.
    expect(screen.getByText(/what does showing work do to the score/i)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /model size/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));

    // Now the size stepper is live and defaults to 8B, where CoT hurts.
    expect(screen.getByRole("group", { name: /model size/i })).toBeInTheDocument();
    // Narration + live region both carry it.
    expect(screen.getAllByText(/chain-of-thought hurts here/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/emergent/i).length).toBeGreaterThan(0);
  });

  it("stepping to 540B shows the big win over the prior record", () => {
    render(<Page5 />);
    fireEvent.click(screen.getByRole("button", { name: /lock in prediction/i }));
    fireEvent.click(screen.getByRole("button", { name: /^540B$/i }));
    expect(screen.getAllByText(/\+39 points from a prompt alone/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/old fine-tuned record of 55/i).length).toBeGreaterThan(0);
  });
});

describe("Page 5 — sourcing", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("keeps the emergence honesty note and the citations on the page", () => {
    render(<Page5 />);
    expect(screen.getByText(/at 8B the chain is/i)).toBeInTheDocument();
    expect(screen.getAllByText(/emergent/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Wei et al. 2022/).length).toBeGreaterThan(0);
    expect(screen.getByText(/quoted from\s+Figure 1/i)).toBeInTheDocument();
  });
});

// The animated path: reduced motion OFF, fake timers; Play streams the chain
// one step at a time and lands exactly once.
describe("Page 5 animated chain (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("Play streams the chain step by step to the landing", () => {
    render(<Page5 />);
    fireEvent.click(exampleOne());
    fireEvent.click(askBtn());
    fireEvent.click(screen.getByRole("button", { name: /▶ play/i }));
    // Before any timer fires: cursor, no first step yet.
    expect(screen.queryByText(D.steps[0])).toBeNull();
    act(() => {
      vi.advanceTimersByTime(800 + 20);
    });
    expect(screen.getAllByText(D.steps[0]).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp(`✓\\s*${D.answer}`))).toBeNull();
    for (let i = 1; i < D.steps.length; i++) {
      act(() => {
        vi.advanceTimersByTime(800 + 20);
      });
    }
    expect(screen.getAllByText(new RegExp(`✓\\s*${D.answer}`)).length).toBeGreaterThan(0);
  });
});
