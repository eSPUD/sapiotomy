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
import { PAGE9, pct, tidyMath } from "@/lib/page09";
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

  // The chain rate is clustered within problems, and the run says so. Quoting it
  // alone reads as one independent observation per chain, which it is not.
  it("names the problem, not the chain, as the unit the count stands on", () => {
    render(<Page9 />);
    const caption = screen.getByText(/a floor, not a rate/i);
    expect(caption.textContent).toMatch(/the same problem sampled again/i);
    expect(caption.textContent).toContain(
      `${PAGE9.detection.nProblems} of the ${PAGE9.detection.nProblemsWithARightChain} problems`,
    );
  });

  // The PRM's cut was fitted against the checker's labels, so its bar is not a
  // second, independent reading of the checker's.
  it("discloses that the PRM's cut was fitted on the checker's labels", () => {
    render(<Page9 />);
    if (!PAGE9.graders.prm) return;
    expect(screen.getByText(/its cut is fitted, not held out/i)).toBeInTheDocument();
    const note = screen.getByText("The PRM").closest("aside")!;
    expect(note.textContent).toMatch(/best matched the checker's own labels/i);
    expect(note.textContent).toContain(`${PAGE9.graders.prm.thresholdPlateauCount} cut-offs`);
    expect(screen.getByText(/not two independent readings of the same thing/i)).toBeInTheDocument();
  });

  // Every specimen scores above the PRM's cut on every line. A reader who works
  // all three must not be left concluding the PRM never disagrees.
  it("bridges the specimens' silent PRM to the share it flags over the run", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const quiet = PAGE9.lucky.steps.every((s) => s.prmVerdict !== "false");
    if (quiet && PAGE9.detection.prm) {
      expect(screen.getByText(/the bar in the next beat/i)).toBeInTheDocument();
      expect(screen.getByText(/quiet end of it/i)).toBeInTheDocument();
    }
  });

  // The specimens are picked by role, and a role like "right answer, false step"
  // can only be filled by a chain the checker could read. So they are drawn from
  // the gradable tail and are far more checkable than the pile they represent.
  it("discloses that the specimens are more gradable than the run", () => {
    render(<Page9 />);
    const box = screen.getByText(/these three are not a sample/i).closest("div")!;
    expect(box.textContent).toContain(
      `${PAGE9.specimenReach.stepsCheckable} of ${PAGE9.specimenReach.stepsTotal}`,
    );
    expect(box.textContent).toContain(pct(PAGE9.specimenReach.shareCheckable));
    expect(box.textContent).toContain(pct(1 - PAGE9.graders.shareUnjudged, 1));
  });

  it("the specimens really are the unrepresentative end, which is why that box exists", () => {
    // If a future run made the specimens typical, the disclosure would be
    // false and should be rewritten rather than left standing.
    const population = 1 - PAGE9.graders.shareUnjudged;
    expect(PAGE9.specimenReach.shareCheckable).toBeGreaterThan(population * 2);
  });

  // The margin says nothing underlined means nothing computable. No verdict on
  // the page may call an unread step sound.
  it("never calls an unjudged step sound", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Broken/ }));
    expect(screen.getByText(/the checker never disproved/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/that were sound/i);
    findTheBreakThenReveal(PAGE9.broken);
    expect(screen.getByText(/before the break was disproved/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/before the break stands?\b/i);
  });

  // `firstFalse` is an index. The count of steps the checker did not disprove is
  // the chain's length minus its false steps, and the two are not the same number.
  it("counts the steps the checker did not disprove rather than reusing the break index", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Broken/ }));
    const notDisproved = PAGE9.broken.steps.length - PAGE9.broken.nFalse;
    expect(
      screen.getByText(
        new RegExp(`including the ${notDisproved} the checker never disproved`, "i"),
      ),
    ).toBeInTheDocument();
    expect(notDisproved).not.toBe(PAGE9.broken.firstFalse);
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
    const loc = PAGE9.localisation;
    if (!loc.survivesSegmentation) {
      const p = screen.getByText(/read it as a direction, not a digit/i);
      // The re-cuts' own range, not a band centred on the median: none of the four
      // segmentations produced the median the sentence quotes.
      expect(p.textContent).toContain(`${pct(loc.subsample.low)} to ${pct(loc.subsample.high)}`);
      expect(p.textContent).toMatch(/none of them landed on the figure quoted here/i);
      const median = (loc.medianShareSound ?? 0) * 100;
      expect(median).toBeLessThan(loc.subsample.low * 100);
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

  it("leaves the run conditions to the notebook, downloadable from the top line", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /graded chains/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-09-outcome-vs-process.zip");
    expect(link).toHaveAttribute("download");
    expect(screen.queryByText(/top-p/i)).toBeNull();
  });
});
