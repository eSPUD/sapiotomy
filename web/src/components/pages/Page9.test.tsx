/**
 * Page 9's component tests.
 *
 * The old suite asserted on the authored trace's prose ("cannot be cancelled").
 * There is no authored prose left, so these assert on the mechanic and on the
 * page's honesty instead: that the outcome view really is blind to the working,
 * that the reveal is gated behind the reader's own marks, that both graders show
 * their verdicts with the right standing (the checker's refusal is not an
 * approval, the PRM's opinion is not a fact), and that the two numbers the page
 * is not allowed to quote flat arrive with their caveats.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PAGE9 } from "@/lib/page09";
import { Page9 } from "./Page9";

const markEverySoundThenReveal = () => {
  fireEvent.click(screen.getByRole("button", { name: /process view/i }));
  const n = PAGE9.lucky.steps.length;
  for (let i = 1; i <= n; i += 1) {
    fireEvent.click(screen.getByRole("button", { name: `Mark step ${i} sound` }));
  }
  fireEvent.click(screen.getByRole("button", { name: /reveal what the graders found/i }));
};

// docs/page_9_refactor.md: the AUC appears ONCE, in the note that admits the PRM. It
// had crept back into the detection figure, which is where a reader would read it as a
// property of the finding rather than of the grader.
describe("Page 9's PRM reliability is quoted once", () => {
  it("keeps the AUC in the margin and out of the figures", () => {
    render(<Page9 />);
    const body = document.body.textContent ?? "";
    expect(body.match(/AUC/g) ?? []).toHaveLength(1);
    const note = screen.getByText(/admitted only after being measured against the checker/);
    expect(note.textContent).toMatch(/AUC/);
  });
});

describe("Page 9 (outcome vs process supervision) component", () => {
  it("sets up what a gradable step requires before the figure asks for one", () => {
    render(<Page9 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toMatch(/what can be graded at all/i);
    expect(headings[1]).toMatch(/grade it yourself/i);
    expect(headings[2]).toMatch(/what step grading buys/i);
  });

  it("warns before the reveal that the checker declines most steps", () => {
    render(<Page9 />);
    const intro = screen.getByText(/the checker had to decline/i);
    const figure = screen.getByRole("heading", { level: 2, name: /grade it yourself/i });
    // The caveat must precede the figure it explains, or the grey labels read as a bug.
    expect(intro.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("opens on the outcome view, which passes the lucky chain", () => {
    render(<Page9 />);
    expect(screen.getByText(/Outcome grader: pass/i)).toBeInTheDocument();
  });

  it("redacts the working in the outcome view, because that grader cannot read it", () => {
    render(<Page9 />);
    // The step text must not be on screen while the outcome grader is the one reading.
    const firstStep = PAGE9.lucky.steps[0].text.slice(0, 30);
    expect(
      screen.queryByText(new RegExp(firstStep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
    ).toBeNull();
  });

  it("makes the reader grade the steps before showing the graders' labels", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    expect(screen.getByRole("button", { name: /mark every step first/i })).toBeDisabled();
  });

  it("reveals a checker label for every step once they are all marked", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    const labelled = screen.getAllByText(/checked: true|checked: FALSE|can't check/);
    expect(labelled).toHaveLength(PAGE9.lucky.steps.length);
  });

  it("shows the PRM's verdict on every step, because it declines none", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    if (PAGE9.graders.prm) {
      expect(screen.getAllByText(/^PRM \d\.\d\d ·/)).toHaveLength(PAGE9.lucky.steps.length);
    }
  });

  it("flags the lucky chain's false step even though its answer was right", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    expect(screen.getAllByText("checked: FALSE").length).toBe(PAGE9.lucky.nFalse);
  });

  it("scores agreement only over the steps the checker could prove", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    const judged = PAGE9.lucky.steps.filter((s) => s.check !== "unknown").length;
    expect(
      screen.getByText(new RegExp(`${judged} of ${PAGE9.lucky.steps.length}`)),
    ).toBeInTheDocument();
  });

  it("says outright that an unchecked step is unproven rather than sound", () => {
    render(<Page9 />);
    markEverySoundThenReveal();
    expect(screen.getByText(/refusals are not approvals/i)).toBeInTheDocument();
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

  it("keeps the domain caveat on screen", () => {
    render(<Page9 />);
    expect(screen.getByText(/a poem has none mid-stanza/i)).toBeInTheDocument();
  });

  it("names both graders in the margin rather than implying a PRM that never ran", () => {
    render(<Page9 />);
    expect(
      screen.getByText(/deterministic arithmetic checker that judges only/i),
    ).toBeInTheDocument();
    if (PAGE9.graders.prm) {
      const note = screen.getByText("The PRM").closest("aside")!;
      expect(note.textContent).toContain(PAGE9.graders.prm.id);
      expect(note.textContent).toMatch(/upper bound/i);
    }
  });

  it("leaves the run conditions to the notebook instead of a footnote", () => {
    render(<Page9 />);
    expect(screen.getByText(/live in the notebook/i)).toBeInTheDocument();
    expect(screen.queryByText(/top-p/i)).toBeNull();
  });
});
