import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so the page takes its instant paths: the
// machine's reply lands whole on Run. The animated describe block below flips
// it OFF to cover the word-by-word streaming and the finish-exactly-once path.
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
const TOTAL_WORDS = WC.machine.reply.reduce((n, p) => n + p.split(" ").length, 0);

// The spec's hard rule for this page: no inference talk. ("training" is
// allowed here, but only in the closing teaser.)
const BANNED = /inference/i;
const expectClean = () => {
  expect(document.body.textContent ?? "").not.toMatch(BANNED);
};

const answerBox = () =>
  screen.getByRole("textbox", { name: /how many world cups spain has won/i });
const answer = (v: string) => {
  fireEvent.change(answerBox(), { target: { value: v } });
  fireEvent.click(screen.getByRole("button", { name: /^answer$/i }));
};
const passToMachine = () =>
  fireEvent.click(screen.getByRole("button", { name: /let the machine take it/i }));
const runButton = () => screen.getByRole("button", { name: /run it/i });
const run = async () => {
  await act(async () => {
    fireEvent.click(runButton());
  });
};

describe("Page 2 (Two Systems)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows everything up front: the question, the machine panel, and the analysis", () => {
    render(<Page2 />);
    // The question shows in the reader's panel and is echoed in the machine's.
    expect(screen.getAllByText(WC.question).length).toBeGreaterThan(0);
    expect(answerBox()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /let the machine take it/i })).toBeInTheDocument();
    // No pop-ups: the machine panel and the two-systems analysis are always on.
    expect(screen.getByRole("region", { name: /the machine tries the question/i })).toBeInTheDocument();
    expect(screen.getByText("System 1 · the pop")).toBeInTheDocument();
    expect(screen.getByText("System 2 · the steps")).toBeInTheDocument();
    // But Run is grayed out until the reader has taken their turn.
    expect(runButton()).toBeDisabled();
    expect(screen.getByText(/unlocks once you answer, or pass/i)).toBeInTheDocument();
    expectClean();
  });

  it("answering the true count lands the right-verdict and unlocks Run", () => {
    render(<Page2 />);
    answer(String(WC.trueCount));
    expect(screen.getByText(/✓ Two\./)).toBeInTheDocument();
    expect(screen.getByText(/the way 4 is there for 2 \+ 2/)).toBeInTheDocument();
    expect(runButton()).toBeEnabled();
    // The form (and its override) is gone once the reader has answered.
    expect(screen.queryByRole("button", { name: /let the machine take it/i })).toBeNull();
    expect(screen.queryByRole("textbox", { name: /how many world cups/i })).toBeNull();
    expectClean();
  });

  it("a wrong count lands the wrong-verdict naming the record", () => {
    render(<Page2 />);
    answer("5");
    expect(screen.getByText(/✗ You said 5;/)).toBeInTheDocument();
    expect(screen.getByText(/cannot be derived, only recalled/)).toBeInTheDocument();
    expect(runButton()).toBeEnabled();
    expectClean();
  });

  it("the override passes the turn: no verdict, Run unlocks, input goes away", () => {
    render(<Page2 />);
    passToMachine();
    expect(screen.getByText(/Fair enough — you passed\./)).toBeInTheDocument();
    expect(runButton()).toBeEnabled();
    expect(screen.queryByText(/✓ Two\./)).toBeNull();
    expect(screen.queryByRole("textbox", { name: /how many world cups/i })).toBeNull();
    expectClean();
  });

  it("run (reduced motion) lands the confident blurt; the analysis was there all along", async () => {
    render(<Page2 />);
    answer(String(WC.trueCount));
    await run();
    // The machine's confident, one-short count is on screen (it names only 2010).
    expect(screen.getByText(/One\. Spain won it in 2010\./)).toBeInTheDocument();
    // The analysis: two systems, the look-alike, the trap, the teaser, the flag.
    expect(screen.getByText("System 1 · the pop")).toBeInTheDocument();
    expect(screen.getByText("System 2 · the steps")).toBeInTheDocument();
    expect(screen.getByText(/looks like a System 1 question/i)).toBeInTheDocument();
    expect(screen.getByText(/the way it may have for you/)).toBeInTheDocument();
    expect(screen.getByText(/delivered with a straight face/)).toBeInTheDocument();
    expect(screen.getByText(/trained on data that includes that final/)).toBeInTheDocument();
    expect(screen.getByText(/verify the final's result before shipping/)).toBeInTheDocument();
    // The run button is consumed.
    expect(screen.queryByRole("button", { name: /run it/i })).toBeNull();
    expectClean();
  });

  it("on the override path the analysis drops the 'may have for you' clause", async () => {
    render(<Page2 />);
    passToMachine();
    await run();
    expect(screen.getByText(/looks like a System 1 question/i)).toBeInTheDocument();
    expect(screen.queryByText(/the way it may have for you/)).toBeNull();
    expectClean();
  });

  it("never says the banned word at any stage of the journey", async () => {
    render(<Page2 />);
    expectClean();
    answer("5");
    expectClean();
    await run();
    expectClean();
  });
});

// The animated path: reduced motion OFF with fake timers, covering the 55ms
// word stream, the mid-stream cursor, and the finish-exactly-once effect.
describe("Page 2 animated streaming (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("streams the reply word by word after the reader takes their turn", async () => {
    const { container } = render(<Page2 />);
    fireEvent.change(answerBox(), { target: { value: String(WC.trueCount) } });
    fireEvent.click(screen.getByRole("button", { name: /^answer$/i }));
    await run();
    expect(screen.getByText("The machine is replying.")).toBeInTheDocument();
    // A couple ticks in: the reply has started and the cursor shows.
    act(() => {
      vi.advanceTimersByTime(55 * 2 + 10);
    });
    expect(container.textContent).toContain("One.");
    expect(container.textContent).toContain("▍");
    // Play it out: the reply completes and the cursor leaves.
    act(() => {
      vi.advanceTimersByTime(55 * (TOTAL_WORDS + 2));
    });
    expect(screen.getByText(/One\. Spain won it in 2010\./)).toBeInTheDocument();
    expect(container.textContent).not.toContain("▍");
    expect(screen.getByText("System 1 · the pop")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(BANNED);
  });
});
