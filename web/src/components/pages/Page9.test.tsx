/**
 * Page 9's component tests.
 *
 * The old suite asserted on the authored trace's prose ("cannot be cancelled").
 * There is no authored prose left, so these assert on the mechanic and on the
 * page's honesty instead: that the outcome view really is blind to the working,
 * that the reveal is gated behind the reader's own marks, and that the two
 * numbers the page is not allowed to quote flat arrive with their caveats.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { PAGE9 } from "@/lib/page09";
import { Page9 } from "./Page9";

const markEverySoundThenReveal = () => {
  fireEvent.click(screen.getByRole("button", { name: /process view/i }));
  const n = PAGE9.lucky.steps.length;
  for (let i = 1; i <= n; i += 1) {
    fireEvent.click(screen.getByRole("button", { name: `Mark step ${i} sound` }));
  }
  fireEvent.click(screen.getByRole("button", { name: /reveal the checker/i }));
};

describe("Page 9 (outcome vs process supervision) component", () => {
  it("opens on the outcome view, which passes the lucky chain", () => {
    render(<Page9 />);
    expect(screen.getByText(/Outcome grader: pass/i)).toBeInTheDocument();
  });

  it("redacts the working in the outcome view, because that grader cannot read it", () => {
    render(<Page9 />);
    // The step text must not be on screen while the outcome grader is the one reading.
    const firstStep = PAGE9.lucky.steps[0].text.slice(0, 30);
    expect(screen.queryByText(new RegExp(firstStep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).
      toBeNull();
  });

  it("makes the reader grade the steps before showing the checker's labels", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    expect(screen.getByRole("button", { name: /mark every step first/i })).toBeDisabled();
  });

  it("reveals a label for every step once they are all marked", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    const labelled = screen.getAllByText(/checked: true|checked: FALSE|nothing to check/);
    expect(labelled).toHaveLength(PAGE9.lucky.steps.length);
  });

  it("flags the lucky chain's false step even though its answer was right", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    expect(screen.getAllByText("checked: FALSE").length).toBe(PAGE9.lucky.nFalse);
  });

  it("scores agreement only over the steps the checker could judge", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    const judged = PAGE9.lucky.steps.filter((s) => s.check !== "unknown").length;
    expect(
      screen.getByText(new RegExp(`${judged} of ${PAGE9.lucky.steps.length}`)),
    ).toBeInTheDocument();
  });

  it("shows the judged claim rather than only the step it came from", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    expect(screen.getAllByText(/^judged:/).length).toBeGreaterThan(0);
  });

  it("quotes localisation with its spread whenever the run says it moves", () => {
    render(<Page9 />);
    if (!PAGE9.localisation.survivesSegmentation) {
      expect(screen.getByText(/moving that rule moves it by up to/i)).toBeInTheDocument();
    }
  });

  it("reports the selector rung as the null it is", () => {
    render(<Page9 />);
    if (PAGE9.selection && !PAGE9.selection.helps) {
      expect(screen.getByText(/that is a null result/i)).toBeInTheDocument();
    }
  });

  it("says the checker declined most of the steps, rather than hiding it", () => {
    render(<Page9 />);
    expect(screen.getByText(/the checker had to decline/i)).toBeInTheDocument();
  });

  it("keeps the domain caveat on screen", () => {
    render(<Page9 />);
    expect(screen.getByText(/a poem has none mid-stanza/i)).toBeInTheDocument();
  });

  it("names the graders in the provenance rather than implying a PRM that never ran", () => {
    render(<Page9 />);
    const chip = screen.getByText(/deterministic arithmetic checker that judges only/i);
    expect(chip).toBeInTheDocument();
    if (PAGE9.graders.prm) {
      expect(within(chip).getByText(new RegExp(PAGE9.graders.prm.id))).toBeInTheDocument();
    }
  });
});
