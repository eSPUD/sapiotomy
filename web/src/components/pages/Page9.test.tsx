/**
 * Page 9's component tests.
 *
 * The old suite asserted on the authored trace's prose ("cannot be cancelled").
 * There is no authored prose left, so these assert on the mechanic and on the
 * page's honesty instead: that the outcome view really is blind to the working,
 * that the reveal is gated behind the reader's own answer, that the checker's
 * reach is shown as reach rather than as a per-step verdict, that the PRM's
 * opinion never dresses as a fact, and that the three numbers the page is not
 * allowed to quote flat arrive with their caveats.
 *
 * The interaction under test changed with the grey chip that prompted it. The
 * reader is asked ONE question — which line goes wrong — because the six-mark
 * version demanded an opinion on prose neither instrument could score, and then
 * paid it back in `can't check` chips.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PAGE9, tidyMath } from "@/lib/page09";
import { Page9 } from "./Page9";

/** Answer the figure's one question, correctly, and reveal. */
const findTheBreakThenReveal = (trace = PAGE9.lucky) => {
  fireEvent.click(screen.getByRole("button", { name: /process view/i }));
  if (trace.firstFalse !== null) {
    fireEvent.click(
      screen.getByRole("button", {
        name: `Mark step ${trace.firstFalse + 1} as the line that goes wrong`,
      }),
    );
  } else {
    fireEvent.click(screen.getByRole("button", { name: /nothing here breaks/i }));
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
    expect(headings[1]).toMatch(/find the break/i);
    expect(headings[2]).toMatch(/what step grading buys/i);
  });

  it("states the checker's reach as a finding before the figure uses it", () => {
    render(<Page9 />);
    // The share it COULD read, quoted positively. The old page quoted the 94% it
    // declined, which is the same fact phrased as an apology for the figure.
    const intro = screen.getByText(/state nothing it can compute/i);
    const figure = screen.getByRole("heading", { level: 2, name: /find the break/i });
    expect(intro.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intro.textContent).toContain(PAGE9.graders.stepsTotal.toLocaleString());
  });

  it("never labels a step with the checker's silence", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    // The reach of the instrument is not a verdict on the step, so it may not be
    // rendered in the verdict slot. This is the defect the page was rebuilt for.
    expect(screen.queryByText(/can't check/i)).toBeNull();
    expect(screen.queryByText(/^unknown$/i)).toBeNull();
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

  it("makes the reader answer before showing the graders' verdicts", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    expect(screen.getByRole("button", { name: /pick a line first/i })).toBeDisabled();
  });

  it("chips a checker verdict only on the steps it could actually read", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const read = PAGE9.lucky.steps.filter((s) => s.check !== "unknown").length;
    expect(screen.getAllByText(/checked: true|checked: FALSE/)).toHaveLength(read);
    expect(read).toBeLessThan(PAGE9.lucky.steps.length);
  });

  it("shows the PRM's verdict on every step, because it is silent on none", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    if (PAGE9.graders.prm) {
      expect(screen.getAllByText(/^PRM \d\.\d\d ·/)).toHaveLength(PAGE9.lucky.steps.length);
    }
  });

  it("flags the lucky chain's false step even though its answer was right", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.getAllByText("checked: FALSE").length).toBe(PAGE9.lucky.nFalse);
  });

  it("reports what the checker could read of the chain, and of the run", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const read = PAGE9.lucky.steps.filter((s) => s.check !== "unknown").length;
    expect(
      screen.getByText(new RegExp(`${read} of ${PAGE9.lucky.steps.length}`)),
    ).toBeInTheDocument();
  });

  it("says outright that silence is not approval", () => {
    render(<Page9 />);
    expect(screen.getByText(/plain is not approval/i)).toBeInTheDocument();
    findTheBreakThenReveal();
    expect(screen.getByText(/nothing at all to say about the other/i)).toBeInTheDocument();
  });

  it("underlines the judged claim in place rather than restating it", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const judged = PAGE9.lucky.steps.find((s) => s.claim)!;
    const marked = screen.getByText(tidyMath(judged.claim!));
    expect(marked.tagName).toBe("MARK");
    // The old layout printed the claim a second time under its step.
    expect(screen.queryByText(/^judged:/)).toBeNull();
  });

  it("settles the reader's answer against the checker's proof", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(
      screen.getByText(new RegExp(`that is the line the checker proves false`, "i")),
    ).toBeInTheDocument();
    expect(screen.getByText("your pick")).toBeInTheDocument();
  });

  it("lets a clean chain be answered with 'nothing breaks'", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Clean/ }));
    findTheBreakThenReveal(PAGE9.clean);
    expect(screen.getByText(/and you said so/i)).toBeInTheDocument();
    // A clean chain is unrefuted, not proven sound, and must say so.
    expect(screen.getByText(/not the same as proving it sound/i)).toBeInTheDocument();
  });

  it("quotes detection as a floor rather than as a rate", () => {
    render(<Page9 />);
    expect(screen.getByText(/read that as a floor, not a rate/i)).toBeInTheDocument();
    expect(screen.getByText(/too few to estimate how common/i)).toBeInTheDocument();
  });

  // Deck-wide copy rule. Pages 5, 6, 7, 8, 13 and 14 each carry this assertion;
  // page 9 was the one page without it, which finishing_touches.md caught and left
  // open ("page 9's copy also carries em dashes, which pages 5 to 8 assert
  // against"). It is asserted here so the gap closes rather than being noticed
  // again by the next review.
  // Checked in BOTH states, because most of this page's copy is behind the
  // reveal and a default-state-only assertion would not have seen any of it.
  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
    findTheBreakThenReveal();
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
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
    expect(screen.getByText(/nothing computable, not nothing wrong/i)).toBeInTheDocument();
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
