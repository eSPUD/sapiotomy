import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Page1 } from "./Page1";

// Reduced motion is ON by default (1 Hz clocks, computer mode as a stepper) so
// most tests are deterministic under fake timers; the animated describe block
// below flips it OFF to cover the timer-driven playthrough.
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

function roundInput(prompt: RegExp) {
  return screen.getByRole("textbox", { name: prompt });
}

function answerRound(n: number, prompt: RegExp, value: string) {
  const region = screen.getByRole("region", { name: new RegExp(`round ${n}`, "i") });
  const input = within(region).getByRole("textbox", { name: prompt });
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value } });
  fireEvent.click(within(region).getByRole("button", { name: /^answer$/i }));
}

describe("Page 1 (Think Fast, Think Slow)", () => {
  beforeEach(() => {
    reducedMotion = true;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders everything up front: all three rounds, the reflection, the results figure", () => {
    render(<Page1 />);
    expect(screen.getByRole("button", { name: /^(✓ )?you$/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /the computer/i })).toHaveAttribute("aria-pressed", "false");
    // No pop-ups: every section is on screen from the first paint.
    for (const n of [1, 2, 3]) {
      expect(screen.getByRole("region", { name: new RegExp(`round ${n}`, "i") })).toBeInTheDocument();
    }
    expect(screen.getByRole("region", { name: /how did you think about it/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /time per round/i })).toBeInTheDocument();
    expect(screen.getByText(/the clock starts when you click into the box/i)).toBeInTheDocument();
    expect(screen.getByText(/nothing here is a benchmark/i)).toBeInTheDocument();
  });

  it("gates later rounds by graying, not hiding: locked inputs are disabled", () => {
    render(<Page1 />);
    expect(roundInput(/your answer to 2 \+ 2/i)).toBeEnabled();
    expect(roundInput(/your answer to 17 × 24/i)).toBeDisabled();
    expect(roundInput(/your answer to 350 × 638/i)).toBeDisabled();
    expect(screen.getByText(/unlocks after round 1/i)).toBeInTheDocument();
    expect(screen.getByText(/unlocks after round 2/i)).toBeInTheDocument();
    // The reflection buttons and the give-up link wait too.
    expect(screen.getByRole("button", { name: /it just popped in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /i give up, show me/i })).toBeDisabled();
  });

  it("unlocks round 2 after a correct round 1 answer", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "4");
    expect(screen.getByText(/it was there before you decided to think/i)).toBeInTheDocument();
    expect(roundInput(/your answer to 17 × 24/i)).toBeEnabled();
    expect(roundInput(/your answer to 350 × 638/i)).toBeDisabled();
    expect(screen.getByText(/in your head, no calculator/i)).toBeInTheDocument();
  });

  it("still unlocks on a wrong answer and shows the correct answer", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "5");
    expect(screen.getByText(/call that a typo and move on/i)).toBeInTheDocument();
    expect(roundInput(/your answer to 17 × 24/i)).toBeEnabled();
  });

  it("answering round 2 unlocks both round 3 and the reflection buttons", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "4");
    answerRound(2, /your answer to 17 × 24/i, "408");
    expect(roundInput(/your answer to 350 × 638/i)).toBeEnabled();
    expect(screen.getByRole("button", { name: /it just popped in/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toBeEnabled();
  });

  it("plays all three rounds and fills the results figure and the echo", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "4");
    answerRound(2, /your answer to 17 × 24/i, "408");
    fireEvent.click(screen.getByRole("button", { name: /i reasoned through it/i }));
    answerRound(3, /your answer to 350 × 638/i, "223,300");
    const img = screen.getByRole("img", { name: /time per round/i });
    const label = img.getAttribute("aria-label") ?? "";
    expect(label).toContain("2 + 2");
    expect(label).toContain("17 × 24");
    expect(label).toContain("350 × 638");
    expect(label).not.toContain("not yet answered");
    expect(screen.getByText(/more steps, more time/i)).toBeInTheDocument();
    expect(screen.getByText(/you felt the gear change/i)).toBeInTheDocument();
    expect(
      screen.getByText(/a question where the size of the problem is not the problem at all/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run it again/i })).toBeInTheDocument();
  });

  it("records a give-up on round 3 and labels it in the results", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "4");
    answerRound(2, /your answer to 17 × 24/i, "408");
    fireEvent.click(screen.getByRole("button", { name: /it just popped in/i }));
    fireEvent.click(screen.getByRole("button", { name: /i give up, show me/i }));
    expect(screen.getByText(/that pause is the point/i)).toBeInTheDocument();
    expect(screen.getByText(/\(gave up\)/)).toBeInTheDocument();
    expect(screen.getByText(/popping has limits/i)).toBeInTheDocument();
  });

  it("locks the reflection pick after the first choice", () => {
    render(<Page1 />);
    answerRound(1, /your answer to 2 \+ 2/i, "4");
    answerRound(2, /your answer to 17 × 24/i, "408");
    fireEvent.click(screen.getByRole("button", { name: /i reasoned through it/i }));
    // Clicking the other choice after picking must not flip the pick.
    fireEvent.click(screen.getByRole("button", { name: /it just popped in/i }));
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /it just popped in/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    answerRound(3, /your answer to 350 × 638/i, "223,300");
    expect(screen.getByText(/you felt the gear change/i)).toBeInTheDocument();
    expect(screen.queryByText(/popping has limits/i)).not.toBeInTheDocument();
  });

  it("plays computer mode as a stepper under reduced motion", () => {
    render(<Page1 />);
    fireEvent.click(screen.getByRole("button", { name: /the computer/i }));
    expect(screen.getByText(/hand-scripted simulation/i)).toBeInTheDocument();
    expect(screen.getByText(/reduced motion is on, so the computer plays step by step/i)).toBeInTheDocument();
    // Step through round 1.
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/it was there before you decided to think/i)).toBeInTheDocument();
    expect(roundInput(/your answer to 2 \+ 2/i)).toHaveValue("4");
    // Step through round 2: the reflection auto-answers "reasoned".
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/notice the clock this time/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // Step through round 3: the results fill with the computer framing.
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText(/instant, then seconds, then minutes/i)).toBeInTheDocument();
    // 150 illustrative seconds render as minutes (stopwatch and results value).
    expect(screen.getAllByText(/2 m 30 s/).length).toBeGreaterThan(0);
    // Switching back to "You" fully resets: rounds relock, values clear.
    fireEvent.click(screen.getByRole("button", { name: /^(✓ )?you$/i }));
    expect(roundInput(/your answer to 2 \+ 2/i)).toHaveValue("");
    expect(roundInput(/your answer to 17 × 24/i)).toBeDisabled();
  });
});

// The animated paths: reduced motion OFF, wall-clock and performance.now faked
// so the auto playthrough, the virtual stopwatch, and the fast-forward chip are
// all exercised deterministically.
describe("Page 1 animated computer mode (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers({
      toFake: ["setTimeout", "setInterval", "clearTimeout", "clearInterval", "Date", "performance"],
    });
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("auto-plays all three rounds with the fast-forward chip and scripted times", () => {
    render(<Page1 />);
    fireEvent.click(screen.getByRole("button", { name: /the computer/i }));
    // No stepper in the animated path.
    expect(screen.queryByText(/reduced motion is on/i)).not.toBeInTheDocument();
    // t=2500: round 1 landed instantly (1.0 s), round 2 is mid-flight and
    // time-compressed, so the fast-forward chip shows.
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(screen.getByRole("textbox", { name: /your answer to 2 \+ 2/i })).toHaveValue("4");
    expect(screen.getAllByText("1.0 s").length).toBeGreaterThan(0);
    expect(screen.getByText(/fast forward/i)).toBeInTheDocument();
    // t=5800: round 2 finished on the scripted 24 s; the chip is gone again.
    act(() => {
      vi.advanceTimersByTime(3300);
    });
    expect(screen.getByRole("textbox", { name: /your answer to 17 × 24/i })).toHaveValue("408");
    expect(screen.getAllByText("24.0 s").length).toBeGreaterThan(0);
    expect(screen.queryByText(/fast forward/i)).not.toBeInTheDocument();
    // t=8800: the script picked "reasoned" and is fast-forwarding round 3.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/fast forward/i)).toBeInTheDocument();
    // t=14000: round 3 landed on the scripted 150 s and the results are full.
    act(() => {
      vi.advanceTimersByTime(5200);
    });
    expect(screen.getAllByText(/2 m 30 s/).length).toBeGreaterThan(0);
    expect(screen.getByText(/instant, then seconds, then minutes/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run it again/i })).toBeInTheDocument();
  });

  it("switching back to You mid-round cancels all pending work", () => {
    render(<Page1 />);
    fireEvent.click(screen.getByRole("button", { name: /the computer/i }));
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    // Mid round 2, with timeouts queued for typing, the pick, and round 3.
    expect(screen.getByText(/fast forward/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^(✓ )?you$/i }));
    // Let every stale timer fire; none may write state for the dead run.
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(screen.getByRole("textbox", { name: /your answer to 2 \+ 2/i })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: /your answer to 17 × 24/i })).toBeDisabled();
    expect(screen.getByRole("timer", { name: /round 1 stopwatch/i })).toHaveTextContent("0.0 s");
    expect(screen.queryByText(/fast forward/i)).not.toBeInTheDocument();
    // The reflection pick was never committed for the dead run.
    expect(screen.getByRole("button", { name: /i reasoned through it/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
