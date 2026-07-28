import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so the walkthrough steps deterministically
// via Next (Play is hidden under reduced motion). The animated block at the
// bottom flips it OFF to cover Play's auto-advance.
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

import { Page2 } from "./Page2";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";

const WC = SPAIN_WORLD_CUPS;

// This page deliberately plants the contrast "retrieval adds facts; inference-
// time scaling adds thinking", so the earlier no-inference rule is lifted here.
// It must still name retrieval (RAG) as the knowledge-gap fix.
const expectRetrievalFraming = () => {
  const body = document.body.textContent ?? "";
  expect(body).toMatch(/retrieval-augmented generation/i);
  expect(body).toMatch(/retrieval adds facts\. inference-time scaling adds thinking\./i);
};

const answerBox = () =>
  screen.getByRole("textbox", { name: /how many world cups spain has won/i });
const nextBtn = () => screen.getByRole("button", { name: /next ▸/i });
const answer = (v: string) => {
  fireEvent.change(answerBox(), { target: { value: v } });
  fireEvent.click(screen.getByRole("button", { name: /^answer$/i }));
};
const walk = () => {
  for (let i = 0; i < WC.machine.reply.length + 3; i++) fireEvent.click(nextBtn());
};

describe("Page 2 (The Knowledge Gap): all content visible, no popping", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows everything up front: the question, both roads, the machine's reply, the analysis", () => {
    render(<Page2 />);
    // The question and the reader's optional count are present.
    expect(screen.getByText(WC.question)).toBeInTheDocument();
    expect(answerBox()).toBeInTheDocument();
    // Both roads are on screen from first paint (dimmed, never hidden).
    expect(screen.getByRole("group", { name: /sealed memory · recall path/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /retrieval · fetch path/i })).toBeInTheDocument();
    // The machine's endpoint node ("One.") is visible before any step (not gated).
    expect(screen.getByText(/“One\.”/)).toBeInTheDocument();
    // The analysis, the teaser, and the flag are all present with no interaction.
    expect(screen.getByText(/It only looks like a lookup/i)).toBeInTheDocument();
    expect(screen.getByText(/trained it on data that includes that final/)).toBeInTheDocument();
    expect(screen.getByText(/verify the final's result before shipping/)).toBeInTheDocument();
    // The knowledge-gap / retrieval contrast is the point of the page.
    expectRetrievalFraming();
  });

  it("the walkthrough starts on the setup prompt and lands on the one-short recall", () => {
    render(<Page2 />);
    expect(screen.getAllByText(/press next, or play, to walk both roads/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/step 0 of 4/i)).toBeInTheDocument();
    walk();
    // The confident, one-short reply is the recall endpoint of the walkthrough.
    expect(
      screen.getAllByText(new RegExp(`recall commits.*${WC.machine.reply[0]}`, "i")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
  });

  it("answering the true count annotates in place without hiding anything", () => {
    render(<Page2 />);
    answer(String(WC.trueCount));
    expect(screen.getByText(/✓ Two\./)).toBeInTheDocument();
    expect(screen.getAllByText(/popped/).length).toBeGreaterThan(0);
    // The input stays put (no pop-out); it just disables to lock the answer.
    expect(answerBox()).toBeInTheDocument();
    // The walkthrough is still fully available.
    expect(nextBtn()).toBeEnabled();
  });

  it("a wrong count annotates the record without gating the rest", () => {
    render(<Page2 />);
    answer("5");
    expect(screen.getByText(/✗ you said 5;/i)).toBeInTheDocument();
    expect(screen.getByText(/can't be counted from memory/i)).toBeInTheDocument();
    expect(answerBox()).toBeInTheDocument();
  });

  it("the 'may have for you' clause only appears once the reader has answered", () => {
    render(<Page2 />);
    expect(screen.queryByText(/the way it may have for you/)).toBeNull();
    answer(String(WC.trueCount));
    expect(screen.getByText(/the way it may have for you/)).toBeInTheDocument();
  });

  it("names retrieval (RAG) as the fix even after the reader plays through", () => {
    render(<Page2 />);
    answer("5");
    walk();
    expectRetrievalFraming();
  });
});

// The animated path: reduced motion OFF with fake timers, covering Play's
// auto-advance to the landing.
describe("Page 2 animated walkthrough (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("Play auto-advances both paths to the one-short landing", () => {
    render(<Page2 />);
    fireEvent.click(screen.getByRole("button", { name: /▶ play/i }));
    expect(screen.getByText(/step 0 of 4/i)).toBeInTheDocument();
    // Advance per tick so React flushes each auto-advance.
    for (let i = 0; i < 4; i++) {
      act(() => {
        vi.advanceTimersByTime(1100 + 20);
      });
    }
    expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(new RegExp(`recall commits.*${WC.machine.reply[0]}`, "i")).length,
    ).toBeGreaterThan(0);
  });
});
