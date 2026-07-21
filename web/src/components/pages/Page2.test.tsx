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
import { WORLD_CUP_2026 } from "@/lib/authored";

const WC = WORLD_CUP_2026;
const WINNER = WC.options[WC.winnerIndex];
const LOSER = WC.options[(WC.winnerIndex + 1) % WC.options.length];
const TOTAL_WORDS = WC.exampleReply.reduce((n, p) => n + p.split(" ").length, 0);

// The spec's hard rule for this page: no inference talk. ("training" is
// allowed here, but only in the machine's own reply and the closing teaser.)
const BANNED = /inference/i;
const expectClean = () => {
  expect(document.body.textContent ?? "").not.toMatch(BANNED);
};

const pickTeam = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const handOver = () =>
  fireEvent.click(screen.getByRole("button", { name: /hand the same question to the machine/i }));
const overrideToMachine = () =>
  fireEvent.click(screen.getByRole("button", { name: /let the machine take it/i }));
const run = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: /run it/i }));
  });
};

describe("Page 2 (Two Systems)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("starts with the question, four names, and the override; no machine, no analysis", () => {
    render(<Page2 />);
    expect(screen.getByText(WC.question)).toBeInTheDocument();
    for (const name of WC.options) {
      expect(screen.getByRole("button", { name })).toHaveAttribute("aria-pressed", "false");
    }
    expect(screen.getByRole("button", { name: /let the machine take it/i })).toBeInTheDocument();
    expect(screen.queryByText(/the machine →/)).toBeNull();
    expect(screen.queryByText("System 1 · the pop")).toBeNull();
    expect(screen.queryByRole("button", { name: /run it/i })).toBeNull();
    expectClean();
  });

  it("picking the recorded winner lands the right-verdict and offers the hand-over", () => {
    render(<Page2 />);
    pickTeam(WINNER);
    expect(screen.getByRole("button", { name: WINNER })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/A watched final files itself\./)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hand the same question to the machine/i }),
    ).toBeInTheDocument();
    // The override disappears once the reader has answered.
    expect(screen.queryByRole("button", { name: /let the machine take it/i })).toBeNull();
    expectClean();
  });

  it("picking another name lands the wrong-verdict naming the recorded winner", () => {
    render(<Page2 />);
    pickTeam(LOSER);
    expect(screen.getByText(new RegExp(`✗ You said ${LOSER};`))).toBeInTheDocument();
    expect(screen.getByText(WINNER, { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText(/cannot be\s+derived, only remembered/)).toBeInTheDocument();
    expectClean();
  });

  it("locks the pick after the first choice", () => {
    render(<Page2 />);
    pickTeam(LOSER);
    pickTeam(WINNER);
    expect(screen.getByRole("button", { name: LOSER })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: WINNER })).toHaveAttribute("aria-pressed", "false");
  });

  it("hand-over opens the machine panel with its labels, prompt echo, and run button", () => {
    render(<Page2 />);
    pickTeam(WINNER);
    handOver();
    expect(screen.getByText(/the exact same question goes to a machine/)).toBeInTheDocument();
    expect(
      screen.getByText(`${WC.machine.label} · ${WC.machine.cutoffLabel} · ${WC.machine.constraintLabel}`),
    ).toBeInTheDocument();
    expect(screen.getByText("example reply, authored · live model to follow")).toBeInTheDocument();
    expect(screen.getByText(`${WC.question} ${WC.options.join(", ")}?`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run it/i })).toBeInTheDocument();
    // The machine has the question now; the hand-over button is gone.
    expect(screen.queryByRole("button", { name: /hand the same question/i })).toBeNull();
    expectClean();
  });

  it("the override skips the human turn: machine panel opens with no verdict, picks go inert", () => {
    render(<Page2 />);
    overrideToMachine();
    expect(screen.getByText(/Fair enough; you passed\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run it/i })).toBeInTheDocument();
    expect(screen.queryByText(/A watched final files itself\./)).toBeNull();
    // Options are locked once the machine has the question.
    pickTeam(WINNER);
    expect(screen.getByRole("button", { name: WINNER })).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByText(/A watched final files itself\./)).toBeNull();
    expectClean();
  });

  it("run (reduced motion) lands the whole reply and reveals the two-systems analysis", async () => {
    render(<Page2 />);
    pickTeam(WINNER);
    handOver();
    await run();
    // The full authored reply is on screen, including its last line.
    expect(screen.getByText(/Straight answer: I don't know, and I can't\./)).toBeInTheDocument();
    expect(screen.getByText(/that final has not been played yet\./)).toBeInTheDocument();
    // The spec's ideal failure: the reply owns the training-data gap.
    expect(document.body.textContent).toMatch(/training data/i);
    expect(document.body.textContent).toMatch(/not trained on the result/i);
    // The analysis: two systems, the machine read, the trap, the teaser.
    expect(screen.getByText("System 1 · the pop")).toBeInTheDocument();
    expect(screen.getByText("System 2 · the steps")).toBeInTheDocument();
    expect(screen.getByText(/looks like a System 1 question\./)).toBeInTheDocument();
    expect(screen.getByText(/that is exactly how you answered it/)).toBeInTheDocument();
    expect(screen.getByText(/guess wearing certainty's clothes/)).toBeInTheDocument();
    expect(screen.getByText(/What if the model had been trained on\s+data/)).toBeInTheDocument();
    expect(screen.getByText(/verify the winner before shipping/)).toBeInTheDocument();
    // The run button is consumed.
    expect(screen.queryByRole("button", { name: /run it/i })).toBeNull();
    expectClean();
  });

  it("on the override path the analysis drops the 'how you answered it' clause", async () => {
    render(<Page2 />);
    overrideToMachine();
    await run();
    expect(screen.getByText(/looks like a System 1 question\./)).toBeInTheDocument();
    expect(screen.queryByText(/that is exactly how you answered it/)).toBeNull();
    expectClean();
  });

  it("never says the banned word at any stage of the journey", async () => {
    render(<Page2 />);
    expectClean();
    pickTeam(LOSER);
    expectClean();
    handOver();
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

  it("streams the reply word by word, then finishes into the analysis", async () => {
    const { container } = render(<Page2 />);
    fireEvent.click(screen.getByRole("button", { name: WINNER }));
    fireEvent.click(screen.getByRole("button", { name: /hand the same question to the machine/i }));
    await run();
    expect(screen.getByText("The machine is replying.")).toBeInTheDocument();
    // A few ticks in: the reply has started, the cursor shows, the end is not out.
    act(() => {
      vi.advanceTimersByTime(55 * 4 + 10);
    });
    expect(screen.getByText(/^Straight answer:/)).toBeInTheDocument();
    expect(container.textContent).toContain("▍");
    expect(screen.queryByText(/has not been played yet\./)).toBeNull();
    expect(screen.queryByText("System 1 · the pop")).toBeNull();
    // Play it out: the reply completes, the cursor leaves, the analysis lands.
    act(() => {
      vi.advanceTimersByTime(55 * (TOTAL_WORDS + 2));
    });
    expect(screen.getByText(/has not been played yet\./)).toBeInTheDocument();
    expect(container.textContent).not.toContain("▍");
    expect(screen.getByText(/declined to guess/)).toBeInTheDocument();
    expect(screen.getByText("System 1 · the pop")).toBeInTheDocument();
    expect(screen.getByText("System 2 · the steps")).toBeInTheDocument();
    expect(document.body.textContent ?? "").not.toMatch(BANNED);
  });
});
