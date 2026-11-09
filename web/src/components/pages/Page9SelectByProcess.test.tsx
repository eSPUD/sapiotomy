/**
 * The generate, grade, select figure: the interactions and the rule. There is
 * no answer key: the figure shows what the PRM does, not whether it was right.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { POOL, PROBLEMS, ROW_MS, SelectByProcess, WRITE_MS } from "./Page9SelectByProcess";

const lowOf = (i: number) => Math.min(...POOL[i].steps.map((s) => s.score));
const keptCards = () => solutions().filter((s) => within(s).queryByText("kept"));

describe("Select", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("never shows an answer key or marks an answer right or wrong", () => {
    render(<SelectByProcess />);
    fireEvent.click(screen.getByRole("button", { name: "3. Select" }));
    expect(screen.queryByText(/answer key/i)).toBeNull();
    expect(screen.queryByText(/[✓✗]/)).toBeNull();
  });

  it("shows the sentence, the pick and the kept card at once, with no delay", () => {
    render(<SelectByProcess />);
    fireEvent.click(screen.getByRole("button", { name: "3. Select" }));
    expect(screen.getAllByTestId("prm-chain-score").map((s) => s.textContent)).toEqual(
      [0, 1, 2, 3].map((i) => lowOf(i).toFixed(2)),
    );
    const best = [0, 1, 2, 3].reduce((b, i) => (lowOf(i) > lowOf(b) ? i : b), 0);
    expect(screen.getByText(/The chain with the highest score is kept/)).toBeInTheDocument();
    expect(keptCards()).toEqual([solutions()[best]]);
    expect(screen.getByTestId("prm-pick")).toHaveTextContent(
      `Solution ${best + 1} has the highest score, ${lowOf(best).toFixed(2)}, so ${POOL[best].answer} is the final answer.`,
    );
  });

  it("still keeps the top one when every solution has a weak step, and says so", () => {
    // Problem 2's four all have a step below the colour cut.
    const { pool, draw } = PROBLEMS[1];
    const low = (i: number) => Math.min(...pool[i].steps.map((s) => s.score));
    expect(draw.every((i) => low(i) < 0.75)).toBe(true);
    render(<SelectByProcess />);
    fireEvent.click(screen.getByRole("button", { name: "Next problem" }));
    fireEvent.click(screen.getByRole("button", { name: "3. Select" }));
    const at = draw.reduce((b, i, k) => (low(i) > low(draw[b]) ? k : b), 0);
    expect(keptCards()).toEqual([solutions()[at]]);
    expect(screen.getByTestId("prm-pick")).toHaveTextContent(
      `Every solution has a step below 0.75. Solution ${at + 1} still has the highest score, ${low(draw[at]).toFixed(2)}, so ${pool[draw[at]].answer} is the final answer.`,
    );
  });

  it("covers the three cases across the three problems", () => {
    const lows = PROBLEMS.map(({ pool, draw }) => draw.map((i) => Math.min(...pool[i].steps.map((s) => s.score))));
    // 1: the kept chain is sound (no step below the cut).
    expect(Math.max(...lows[0])).toBeGreaterThanOrEqual(0.75);
    // 2: every chain is weak.
    expect(lows[1].every((l) => l < 0.75)).toBe(true);
    // 3: two chains share the kept answer, one of them scored low.
    const { pool, draw } = PROBLEMS[2];
    const kept = draw[lows[2].indexOf(Math.max(...lows[2]))];
    const same = draw.filter((i) => pool[i].answer === pool[kept].answer && i !== kept);
    expect(same.length).toBeGreaterThan(0);
    same.forEach((i) => expect(Math.min(...pool[i].steps.map((s) => s.score))).toBeLessThan(0.75));
  });

  it("stops Next at Select, and Reset goes back to the empty start with the same chains", () => {
    render(<SelectByProcess />);
    start();
    playOut();
    const before = solutions().map((s) => s.textContent).join("|");
    fireEvent.click(screen.getByRole("button", { name: "3. Select" }));
    expect(next()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    // Empty again, waiting for Start: Generate, which replays the same four.
    solutions().forEach((s) => expect(stepsIn(s)).toHaveLength(0));
    STAGE_NAMES.forEach((n) => expect(screen.getByRole("button", { name: n })).toHaveAttribute("aria-pressed", "false"));
    start();
    playOut();
    expect(solutions().map((s) => s.textContent).join("|")).toBe(before);
  });
});

function solutions() {
  return screen.getAllByTestId("prm-solution");
}
const next = () => screen.getByRole("button", { name: /^Next(:| ▸)/ });
const start = () => fireEvent.click(screen.getByRole("button", { name: "Start: Generate ▸" }));
const scoresIn = (el: HTMLElement) => within(el).queryAllByText(/^\d\.\d\d$/);
const stepsIn = (el: HTMLElement) => within(el).queryAllByRole("listitem");
const tick = () => act(() => void vi.advanceTimersByTime(ROW_MS));
/** Finish a writing or grading replay: one tick per row, each in its own act so the next timer gets set. */
const playOut = () => {
  for (let i = 0; i < 40; i++) tick();
};
const STAGE_NAMES = ["1. Generate", "2. Grade", "3. Select"];

describe("Generate, grade, select", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("opens empty and waits for Start: Generate", () => {
    render(<SelectByProcess />);
    solutions().forEach((s) => expect(stepsIn(s)).toHaveLength(0));
    STAGE_NAMES.forEach((n) => expect(screen.getByRole("button", { name: n })).toHaveAttribute("aria-pressed", "false"));
    // Nothing plays out by itself.
    playOut();
    solutions().forEach((s) => expect(stepsIn(s)).toHaveLength(0));
    start();
    expect(screen.getByRole("button", { name: "1. Generate" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/The generation model writes four different chains/)).toBeInTheDocument();
  });

  it("shows each solution whole, one after another, and no scores before grading", () => {
    render(<SelectByProcess />);
    start();
    expect(solutions()).toHaveLength(4);
    solutions().forEach((s) => expect(stepsIn(s)).toHaveLength(0));
    expect(next()).toBeDisabled();
    // Each beat brings in one more solution, every step and its answer at once.
    for (let k = 1; k <= 4; k++) {
      act(() => void vi.advanceTimersByTime(WRITE_MS));
      solutions().forEach((s, i) => {
        expect(stepsIn(s)).toHaveLength(i < k ? POOL[i].steps.length : 0);
        expect(within(s).queryByText(POOL[i].answer, { selector: ".font-semibold" }) !== null).toBe(i < k);
      });
      expect(next()).toHaveProperty("disabled", k < 4);
    }
    solutions().forEach((s, i) => {
      expect(stepsIn(s)).toHaveLength(POOL[i].steps.length);
      expect(scoresIn(s)).toHaveLength(0);
    });
  });

  it("grades one solution at a time, then scores each by its lowest step", () => {
    render(<SelectByProcess />);
    start();
    playOut();
    fireEvent.click(next());
    // Nothing yet, then solution 1's first step and no other solution's.
    expect(scoresIn(solutions()[0])).toHaveLength(0);
    act(() => void vi.advanceTimersByTime(ROW_MS));
    expect(scoresIn(solutions()[0])).toHaveLength(1);
    solutions().slice(1).forEach((s) => expect(scoresIn(s)).toHaveLength(0));
    expect(screen.getByTestId("prm-focus")).toHaveTextContent(
      "Step 1 of solution 1: the PRM read the problem and steps 1 to 1.",
    );
    // Solution 2 starts only once solution 1 is fully scored.
    for (let i = 1; i < POOL[0].steps.length; i++) act(() => void vi.advanceTimersByTime(ROW_MS));
    expect(scoresIn(solutions()[1])).toHaveLength(0);
    act(() => void vi.advanceTimersByTime(ROW_MS));
    expect(scoresIn(solutions()[1])).toHaveLength(1);
    expect(next()).toBeDisabled();
    playOut();
    expect(next()).toBeEnabled();
    // Once every step is scored, the rule is named, without claiming a weak step makes the answer wrong.
    expect(screen.getByTestId("prm-focus")).toHaveTextContent(
      "A solution scores its weakest step: one doubtful step pulls it down, whatever answer it reaches.",
    );
    // Solution 1 of the first draw: every step scored, plus its score line.
    const first = POOL[0];
    expect(scoresIn(solutions()[0])).toHaveLength(first.steps.length + 1);
    const low = Math.min(...first.steps.map((s) => s.score));
    expect(within(solutions()[0]).getAllByText(low.toFixed(2)).length).toBeGreaterThanOrEqual(1);
    // The step the score came from is marked, and it is the lowest one, not the last.
    const marked = solutions()[0].querySelectorAll("[data-lowest]");
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveTextContent(low.toFixed(2));
    expect(first.steps.at(-1)!.score).not.toBe(low);
  });

  it("keeps the stage note on screen while a step is in focus", () => {
    render(<SelectByProcess />);
    start();
    playOut();
    fireEvent.click(next());
    act(() => void vi.advanceTimersByTime(ROW_MS));
    expect(
      screen.getByText(/process reward model \(PRM\), separate from the generation model, scores each step/),
    ).toBeInTheDocument();
  });

  it("keeps the solution whose lowest step is highest", () => {
    render(<SelectByProcess />);
    start();
    playOut();
    fireEvent.click(next());
    playOut();
    fireEvent.click(next());
    const lows = [0, 1, 2, 3].map((i) => Math.min(...POOL[i].steps.map((s) => s.score)));
    const best = lows.indexOf(Math.max(...lows));
    solutions().forEach((s, i) =>
      expect(within(s).queryByText(/kept/) !== null).toBe(i === best),
    );
  });

  it("names the steps the PRM read when a graded step is hovered", () => {
    render(<SelectByProcess />);
    start();
    playOut();
    fireEvent.click(next());
    playOut();
    const third = within(solutions()[1]).getAllByRole("listitem")[2];
    fireEvent.mouseEnter(third);
    expect(screen.getByTestId("prm-focus")).toHaveTextContent(
      "Step 3 of solution 2: the PRM read the problem and steps 1 to 3.",
    );
  });

  it("has no re-sample button", () => {
    render(<SelectByProcess />);
    expect(screen.queryByRole("button", { name: /sample/i })).toBeNull();
  });

  it("every pool chain, in every problem, fits its column and ends on an answer step", () => {
    for (const { pool, draw } of PROBLEMS) {
      expect(draw).toHaveLength(4);
      expect(new Set(draw).size).toBe(4);
      draw.forEach((i) => expect(pool[i]).toBeDefined());
      for (const c of pool) {
        expect(c.steps.length).toBeLessThanOrEqual(7);
        expect(c.steps.at(-1)!.text).toBe(`Answer: ${c.answer}`);
        c.steps.forEach((s) => expect(s.text.length).toBeLessThanOrEqual(22));
      }
    }
  });

  it("steps through the problems with the arrows, each back at the empty start", () => {
    render(<SelectByProcess />);
    const prev = () => screen.getByRole("button", { name: "Previous problem" });
    const fwd = () => screen.getByRole("button", { name: "Next problem" });
    expect(screen.getByText("problem 1 of 3")).toBeInTheDocument();
    expect(prev()).toBeDisabled();
    start();
    playOut();
    for (const p of [1, 2]) {
      fireEvent.click(fwd());
      expect(screen.getByText(`problem ${p + 1} of 3`)).toBeInTheDocument();
      expect(screen.getByTestId("prm-problem")).toHaveTextContent(PROBLEMS[p].text);
      // Empty until started, then this problem's four.
      solutions().forEach((s) => expect(stepsIn(s)).toHaveLength(0));
      start();
      playOut();
      const { pool, draw } = PROBLEMS[p];
      solutions().forEach((s, i) => expect(s).toHaveTextContent(pool[draw[i]].steps[0].text));
    }
    expect(fwd()).toBeDisabled();
    fireEvent.click(prev());
    expect(screen.getByTestId("prm-problem")).toHaveTextContent(PROBLEMS[1].text);
  });
});
