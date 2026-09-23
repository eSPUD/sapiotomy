import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Page1 } from "./Page1";
import { SYSTEMS } from "@/lib/authored";

// The redesigned Page 1 is a System 1 / System 2 contrast: a one-tap reveal on
// the fast side, a three-tap walkthrough on the slow side, and a drag-or-select
// sorting game. No fake timers needed — the stopwatch is incidental to behavior.
const mm = (q: string) => ({
  matches: false,
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

describe("Page 1 (Think Fast, Think Slow)", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("keeps the exact H1 the e2e traversal asserts", () => {
    render(<Page1 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Think Fast, Think Slow");
  });

  it("System 1: one tap reveals the product instantly", () => {
    render(<Page1 />);
    const s1 = screen.getByRole("region", { name: "System 1" });
    expect(within(s1).queryByText(SYSTEMS.fast.answer)).not.toBeInTheDocument();
    fireEvent.click(within(s1).getByRole("button", { name: /obvious/i }));
    expect(within(s1).getByText(SYSTEMS.fast.answer)).toBeInTheDocument();
  });

  it("System 2: tapping through the steps builds up to the answer", () => {
    render(<Page1 />);
    const s2 = screen.getByRole("region", { name: "System 2" });
    // Work it out, then Next step for each remaining line.
    fireEvent.click(within(s2).getByRole("button", { name: /work it out/i }));
    for (const line of SYSTEMS.slow.steps.slice(1)) {
      expect(within(s2).getByRole("button", { name: /next step/i })).toBeInTheDocument();
      fireEvent.click(within(s2).getByRole("button", { name: /next step/i }));
      expect(within(s2).getByText(line)).toBeInTheDocument();
    }
    // Final line and answer are both present.
    expect(within(s2).getByText(SYSTEMS.slow.answer)).toBeInTheDocument();
  });

  it("numbers the Kahneman citation inline and in the references note", () => {
    const { container } = render(<Page1 />);
    // The two-systems framing carries an inline marker...
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toMatch(/1$/);
    // ...matching a numbered entry in the References note.
    expect(document.body.textContent ?? "").toMatch(/1\.\s*Daniel Kahneman/);
  });

  it("keeps the Page 2 → nav link the e2e traversal follows", () => {
    render(<Page1 />);
    expect(screen.getByRole("link", { name: /Page 2 →/ })).toBeInTheDocument();
  });
});

describe("Page 1 sorting game (SystemSort)", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("select-then-place locks a correct answer in", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", {
      name: /Sort the questions into System 1 or System 2/i,
    });
    // Select the first pool chip, then place it in System 1.
    const chip = within(game).getByRole("button", { name: /Recognize a friend's face/i });
    fireEvent.click(chip);
    const placeBtns = within(game).getAllByRole("button", { name: /place here/i });
    fireEvent.click(placeBtns[0]); // System 1 bin comes first
    // It now shows locked-in as a list item and left the clickable pool.
    expect(within(game).getByRole("listitem")).toHaveTextContent(/Recognize a friend's face/);
    expect(
      within(game).queryByRole("button", { name: /Recognize a friend's face/i }),
    ).not.toBeInTheDocument();
  });

  it("counts up as items are sorted", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", {
      name: /Sort the questions into System 1 or System 2/i,
    });
    expect(within(game).getByText(/0 \/ 6 sorted/)).toBeInTheDocument();
  });

  // The definition comes after the widgets, so the reader feels both systems
  // first; the close hints at training versus thinking time without naming either.
  it("defines the two systems by familiarity, then closes on learned versus thought", () => {
    render(<Page1 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/A good rule of thumb for telling the two systems apart is familiarity/);
    expect(body).toMatch(/it often leads to a better\s*answer, one with fewer errors/);
    expect(body).toMatch(/Remember the difference between the two systems/);
    expect(body).toMatch(/Others depend on how long you are willing to think/);
  });
});

describe("Page 1 copy", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("opens by naming inference-time scaling, then the two systems", () => {
    render(<Page1 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Inference-time scaling, put simply, is about giving a large language model \(LLM\) more\s*time/);
    expect(body).toMatch(/The human mind runs two systems\./);
  });

  it("shows the new reveal lines and drops the panel captions", () => {
    render(<Page1 />);
    const s1 = screen.getByRole("region", { name: "System 1" });
    fireEvent.click(within(s1).getByRole("button", { name: /obvious/i }));
    expect(within(s1).getByText(/The answer comes instantly because it's familiar\. No computing necessary\./)).toBeInTheDocument();
    const s2 = screen.getByRole("region", { name: "System 2" });
    fireEvent.click(within(s2).getByRole("button", { name: /work it out/i }));
    for (let i = 1; i < SYSTEMS.slow.steps.length; i++) {
      fireEvent.click(within(s2).getByRole("button", { name: /next step/i }));
    }
    expect(within(s2).getByText("Not instant. You have to build it step by step.")).toBeInTheDocument();
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/Recognition, not work/);
    expect(body).not.toMatch(/You feel every step/);
  });

  it("keeps rendered text free of em dashes, before and after both reveals", () => {
    render(<Page1 />);
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
    fireEvent.click(screen.getByRole("button", { name: /obvious/i }));
    fireEvent.click(screen.getByRole("button", { name: /work it out/i }));
    for (let i = 1; i < SYSTEMS.slow.steps.length; i++) {
      fireEvent.click(screen.getByRole("button", { name: /next step/i }));
    }
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
  });
});
