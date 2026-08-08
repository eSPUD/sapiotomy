/**
 * Page 9's component tests.
 *
 * There is no authored prose left, so these assert on the mechanic and on the
 * page's honesty: that the outcome view is blind to the working, that the reveal
 * is gated behind the reader's own answer and re-answerable, that the checker's
 * reach is shown as reach rather than as a per-step verdict, that the PRM's
 * opinion never dresses as a fact (and, on these specimens, is caught being
 * wrong), and that the three numbers the page is not allowed to quote flat arrive
 * with their caveats.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PAGE9, tidyMath } from "@/lib/page09";
import { Page9 } from "./Page9";

/** The mark-a-step button label for a given zero-based step index. */
const markName = (i: number) => `Mark step ${i + 1} as the line that goes wrong`;

/** Answer the figure's one question, correctly, and reveal. */
const findTheBreakThenReveal = (trace = PAGE9.lucky) => {
  fireEvent.click(screen.getByRole("button", { name: /process view/i }));
  if (trace.firstFalse !== null) {
    fireEvent.click(screen.getByRole("button", { name: markName(trace.firstFalse) }));
  } else {
    fireEvent.click(screen.getByRole("button", { name: /nothing here breaks/i }));
  }
  fireEvent.click(screen.getByRole("button", { name: /reveal what the graders found/i }));
};

// The AUC appears ONCE, in the note that admits the PRM. It may not sit in the
// figure, where a reader would read it as a property of the finding.
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
  it("carries the notebook download at the top right", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /notebook \+ .*chains/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-09-outcome-vs-process.zip");
  });

  it("sets up what a gradable step requires before the figure asks for one", () => {
    render(<Page9 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toMatch(/what can be graded at all/i);
    expect(headings[1]).toMatch(/find the break/i);
    expect(headings[2]).toMatch(/what step grading buys/i);
  });

  it("states the three conditions on a gradable step", () => {
    render(<Page9 />);
    // 1: a fact to be right about; 2: a right answer can hide a wrong step;
    // 3: the unit is the step, not the word.
    expect(screen.getByText(/there has to be a fact/i)).toBeInTheDocument();
    expect(screen.getByText(/a right answer can be reached by a wrong step/i)).toBeInTheDocument();
    expect(screen.getByText(/the unit is the step, not the word/i)).toBeInTheDocument();
  });

  it("states the checker's reach as a finding before the figure uses it", () => {
    render(<Page9 />);
    const intro = screen.getByText(/state nothing it can compute/i);
    const figure = screen.getByRole("heading", { level: 2, name: /find the break/i });
    expect(intro.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intro.textContent).toContain(PAGE9.graders.stepsTotal.toLocaleString());
  });

  it("never labels a step with the checker's silence", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.queryByText(/can't check/i)).toBeNull();
    expect(screen.queryByText(/^unknown$/i)).toBeNull();
  });

  it("opens on the outcome view, which passes the lucky chain", () => {
    render(<Page9 />);
    expect(screen.getByText(/Outcome grader: pass/i)).toBeInTheDocument();
  });

  it("redacts the working in the outcome view, because that grader cannot read it", () => {
    render(<Page9 />);
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

  it("toggles a pick off when the same line is clicked twice", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    const line = markName(PAGE9.lucky.firstFalse!);
    fireEvent.click(screen.getByRole("button", { name: line }));
    expect(screen.getByRole("button", { name: /reveal what the graders found/i })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: line }));
    expect(screen.getByRole("button", { name: /pick a line first/i })).toBeDisabled();
  });

  it("lets the reader grade again after the reveal", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.getByText(/that is the line the checker proves false/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /grade another line/i }));
    // Back to picking: the reveal verdict is gone and the mark buttons return.
    expect(screen.queryByText(/that is the line the checker proves false/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: markName(PAGE9.lucky.firstFalse!) }),
    ).toBeInTheDocument();
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

  it("annotates that the PRM missed the break the checker proved", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const bs = PAGE9.lucky.steps[PAGE9.lucky.firstFalse!];
    // These specimens are chosen so the PRM scores the proven-false step as sound.
    if (bs.prm !== null && bs.prmVerdict !== "false") {
      expect(screen.getByText(/the PRM missed it/i)).toBeInTheDocument();
      expect(screen.getByText(/difference between a fact and a score/i)).toBeInTheDocument();
    }
  });

  it("underlines the judged claim in place rather than restating it", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const judged = PAGE9.lucky.steps.find((s) => s.claim)!;
    const marked = screen.getByText(tidyMath(judged.claim!));
    expect(marked.tagName).toBe("MARK");
    expect(screen.queryByText(/^judged:/)).toBeNull();
  });

  it("settles the reader's answer against the checker's proof", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(
      screen.getByText(/that is the line the checker proves false/i),
    ).toBeInTheDocument();
    expect(screen.getByText("your pick")).toBeInTheDocument();
  });

  it("lets a clean chain be answered with 'nothing breaks'", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Clean/ }));
    findTheBreakThenReveal(PAGE9.clean);
    expect(screen.getByText(/and you said so/i)).toBeInTheDocument();
    expect(screen.getByText(/not the same as proving it sound/i)).toBeInTheDocument();
  });

  it("frames section 3 as one figure and identifies the graders it plots", () => {
    render(<Page9 />);
    expect(
      screen.getByText(/how often a right answer hides a false step/i),
    ).toBeInTheDocument();
    // The PRM is named by model, not left as a generic "process reward model", and
    // the outcome grader is stated as the zero baseline rather than plotted as a model.
    if (PAGE9.graders.prm) {
      const name = PAGE9.graders.prm.id.split("/").pop()!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(screen.getAllByText(new RegExp(name)).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/catches none of this by construction/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Outcome grader$/)).toBeNull();
  });

  it("quotes detection as a floor rather than as a rate", () => {
    render(<Page9 />);
    expect(screen.getByText(/a floor, not a rate/i)).toBeInTheDocument();
    expect(screen.getByText(/undercounts/i)).toBeInTheDocument();
  });

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
      expect(screen.getByText(/moving where a step ends moves it by up to/i)).toBeInTheDocument();
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

  it("cites Lightman as a numbered reference reachable from an inline marker", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /Let's Verify Step by Step/ });
    expect(link).toHaveAttribute("href", "https://arxiv.org/abs/2305.20050");
    expect(screen.getByText("preprint")).toBeInTheDocument();
    expect(document.querySelector("a[href='#ref-1']")).not.toBeNull();
    expect(document.getElementById("ref-1")).not.toBeNull();
  });

  it("leaves the run conditions to the notebook instead of a footnote", () => {
    render(<Page9 />);
    expect(screen.getByText(/live in the notebook/i)).toBeInTheDocument();
    expect(screen.queryByText(/top-p/i)).toBeNull();
  });
});
