/**
 * Beat 1's figure: two solutions as an ORM sees them and as a PRM sees them.
 * It has to carry that reading the steps tells a wrong answer from a right one
 * with no answer key, and it says nothing yet about how a PRM picks.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { OutcomeOrProcess, OutcomeVsProcess, SOLUTIONS } from "./Page9OutcomeVsProcess";
import { CUT } from "./Page9SelectByProcess";

const next = () => fireEvent.click(screen.getByRole("button", { name: "Next solution" }));

describe("Page 9 beat 1: outcome or process", () => {
  it("draws a sound solution first, then one that goes wrong at step 2", () => {
    const [sound, broken] = SOLUTIONS;
    expect(sound.chain.answer).toBe("21");
    expect(sound.chain.steps.every((s) => s.score >= CUT)).toBe(true);
    expect(broken.chain.answer).not.toBe("21");
    // 2961 = 378 × 7 + 315; the solution writes 255.
    expect(broken.chain.steps[1].text).toBe("2961 = 378 × 7 + 255");
    expect(2961 - 378 * 7).toBe(315);
    expect(broken.chain.steps.findIndex((s) => s.score < CUT)).toBe(1);
  });

  it("gives the ORM one score per solution, lower on the one that goes wrong", () => {
    render(<OutcomeVsProcess />);
    const scoreOf = () => within(screen.getByTestId("orm-panel")).getAllByTestId("orm-score");
    expect(scoreOf()).toHaveLength(1);
    expect(scoreOf()[0]).toHaveTextContent(SOLUTIONS[0].orm.toFixed(2));
    next();
    expect(scoreOf()).toHaveLength(1);
    expect(scoreOf()[0]).toHaveTextContent(SOLUTIONS[1].orm.toFixed(2));
    expect(SOLUTIONS[1].orm).toBeLessThan(SOLUTIONS[0].orm);
  });

  it("gives the PRM a score per step and boxes the step where the solution breaks", () => {
    render(<OutcomeVsProcess />);
    const scores = () => within(screen.getByTestId("prm-panel")).getAllByTestId("prm-step-score");
    expect(scores()).toHaveLength(SOLUTIONS[0].chain.steps.length);
    expect(scores().filter((s) => s.hasAttribute("data-break"))).toHaveLength(0);
    next();
    expect(scores()).toHaveLength(SOLUTIONS[1].chain.steps.length);
    const boxed = scores().filter((s) => s.hasAttribute("data-break"));
    expect(boxed).toEqual([scores()[1]]);
  });

  it("steps between the two solutions with arrows", () => {
    render(<OutcomeVsProcess />);
    expect(screen.getByText(`solution 1 of ${SOLUTIONS.length}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous solution" })).toBeDisabled();
    next();
    expect(screen.getByText(`solution 2 of ${SOLUTIONS.length}`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next solution" })).toBeDisabled();
  });

  it("shows each solution's answer under both judges and no answer key", () => {
    render(<OutcomeVsProcess />);
    for (const s of SOLUTIONS) {
      for (const id of ["orm-panel", "prm-panel"]) {
        expect(within(screen.getByTestId(id)).getByText(s.chain.answer)).toBeInTheDocument();
      }
      const fig = document.getElementById("orm-vs-prm")!;
      expect(fig.textContent).not.toMatch(/✓|✗|correct|key/i);
      if (s !== SOLUTIONS[SOLUTIONS.length - 1]) next();
    }
  });

  it("puts wrong-from-right first and the lucky right answer second", () => {
    render(<OutcomeOrProcess />);
    expect(screen.getByText(/a strong hint that the result is wrong\. No answer key required\./)).toBeInTheDocument();
    expect(screen.getByText(/the rarer case of a right answer reached through a wrong step/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/a trap/i);
  });

  // An ORM reads the reasoning too; only an answer-key check never opens it. The
  // difference the beat may claim is the training label, one per solution or one per step.
  it("says the outcome judge reads the steps and differs in what it was trained to judge", () => {
    render(<OutcomeOrProcess />);
    const opening = screen.getByText(/a judge trained only on the outcome reads the steps/i);
    expect(opening.textContent).toMatch(/never taught to judge them/i);
    expect(opening.textContent).toMatch(/trained on the reasoning/i);
    const second = screen.getByText(/that changes what the judge can do/i);
    expect(second.textContent).toMatch(/second opinion on the answer: one score for how likely it is to be right/i);
    expect(second.textContent).toMatch(/no way to say where the solution went wrong/i);
    // Re-solving the problem is what a general model does, not an ORM.
    expect(second.textContent).toMatch(/a general model asked the same question may even solve the problem again/i);
    const copy = document.body.textContent ?? "";
    expect(copy).not.toMatch(/blind to the process/i);
    expect(copy).not.toMatch(/sees only|only sees|only the (final )?answer/i);
    // The figure is introduced as a side-by-side and has no paragraph under it.
    expect(screen.getByText(/let's look at a quick side-by-side view of how each model judges\./i)).toBeInTheDocument();
    expect(copy).not.toMatch(/neither judge has the answer key/i);
    expect(document.getElementById("orm-vs-prm")!.nextElementSibling).toBeNull();
  });

  it("draws the ORM reading every step inside one bracket with one score", () => {
    render(<OutcomeVsProcess />);
    const orm = screen.getByTestId("orm-panel");
    for (const s of SOLUTIONS[0].chain.steps) {
      expect(within(orm).getByText(s.text)).toBeInTheDocument();
    }
    expect(within(orm).getAllByTestId("orm-score")).toHaveLength(1);
  });

  it("names both models, and leaves how a PRM picks to the next beat", () => {
    render(<OutcomeOrProcess />);
    expect(screen.getByText("outcome reward model")).toBeInTheDocument();
    expect(screen.getByText("process reward model")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/weakest step|highest score/i);
  });
});
