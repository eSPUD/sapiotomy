import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page19 } from "./Page19";

const stat = (name: RegExp) => screen.getByRole("status", { name });

describe("Page 19 (the frontier) component", () => {
  it("shows Coconut's planning gain and math give-back, verbatim from the data file", () => {
    render(<Page19 />);
    for (const v of ["77.5%", "97.0%", "42.9%", "34.1%"]) {
      expect(screen.getByText(v)).toBeInTheDocument();
    }
    // ...and reads the trade in both directions, not as a pure win.
    expect(screen.getByText(/not uniformly better reasoning/i)).toBeInTheDocument();
  });

  it("flags the monitorability tension with page 18, which is the page that asked", () => {
    render(<Page19 />);
    const callout = screen.getByText(/there is nothing to read, faithful or not/i).closest("div")!;
    // Was "page 17", and this assertion was written to match, so the suite
    // enforced the error. 18 is the faithfulness page (pages.ts:67).
    expect(callout.textContent).toMatch(/page 18/i);
    expect(callout.textContent).not.toMatch(/page 17/i);
    expect(callout.textContent).toMatch(/preprint-stage/i);
  });

  it("puts Coconut's GPT-2 scale in the figure, not only in the page footer", () => {
    render(<Page19 />);
    // The four bars carry the argument; a ~20-point planning gain read as a
    // frontier result is a much larger claim than the source makes.
    const fig = screen.getByRole("img", { name: /GPT-2-scale model thinking in words/i });
    expect(fig.textContent).toMatch(/One GPT-2-scale model, two thinking media/);
  });

  it("opens the panel on classic CoT: readable and ten times the direct-answer bill", () => {
    render(<Page19 />);
    // Accuracy is rounded, not printed to a decimal: the whole scale is
    // authored (reasoner.ts), and "68.0%" reads as a measurement.
    expect(stat(/suite accuracy/)).toHaveTextContent("47%");
    expect(stat(/suite accuracy/)).not.toHaveTextContent("47.0%");
    expect(stat(/compute bill/)).toHaveTextContent("10.0×");
    expect(stat(/latency/)).toHaveTextContent("10.0×");
    expect(stat(/monitorability/)).toHaveTextContent("90");
  });

  it("switching the medium to latent collapses the bill and the transcript", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("button", { name: "in latent space" }));
    expect(stat(/compute bill/)).toHaveTextContent("2.0×");
    expect(stat(/monitorability/)).toHaveTextContent("20");
  });

  it("samples raise the bill but not the latency", () => {
    render(<Page19 />);
    fireEvent.change(screen.getByRole("slider", { name: /samples/i }), { target: { value: "8" } });
    expect(stat(/compute bill/)).toHaveTextContent("80.0×");
    expect(stat(/latency/)).toHaveTextContent("10.0×");
  });

  it("an adaptive budget cuts the bill and charges for the misestimate", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("switch", { name: /adaptive budget/i }));
    expect(stat(/compute bill/)).toHaveTextContent("6.0×");
    // It used to be strictly dominant: cheaper, faster, and free. A lever with
    // no cost gives the reader no reason to ever switch it off.
    expect(stat(/suite accuracy/)).not.toHaveTextContent("47%");
    expect(stat(/monitorability/)).not.toHaveTextContent("90");
  });

  it("charges readability to tree search too, not only to latent thought", () => {
    render(<Page19 />);
    expect(stat(/monitorability/)).toHaveTextContent("90");
    fireEvent.click(screen.getByRole("switch", { name: /tree search/i }));
    // pages.ts:68 promises "what each costs in readability" for all three
    // frontier directions, and search used to cost nothing.
    expect(stat(/monitorability/)).not.toHaveTextContent("90");
  });

  it("the Latent frontier preset composes the whole stack", () => {
    render(<Page19 />);
    fireEvent.click(screen.getByRole("button", { name: "Latent frontier" }));
    expect(stat(/suite accuracy/)).toHaveTextContent("67%");
    expect(stat(/compute bill/)).toHaveTextContent("36.0×");
    expect(stat(/monitorability/)).toHaveTextContent("15");
  });

  it("hides the thought-dependent controls when there are no thoughts", () => {
    render(<Page19 />);
    expect(screen.getByRole("switch", { name: /tree search/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: /chain of thought/i }));
    expect(screen.queryByRole("switch", { name: /tree search/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "in latent space" })).not.toBeInTheDocument();
  });

  it("keeps every reference note to a bare cite, as pages 3-8 do", () => {
    render(<Page19 />);
    const notes = screen.getAllByText("References").map((k) => k.closest("aside")!);
    expect(notes.length).toBe(3);
    for (const note of notes) {
      expect(note.textContent).not.toMatch(/arXiv|ICLR|COLM|NeurIPS|EMNLP|Table/);
    }
  });

  it("gives every numbered cite on the page a reference entry", () => {
    render(<Page19 />);
    // Cutting the "budgets that flex" step took Snell's reference note with it
    // and left the capstone's adaptive cite pointing at nothing.
    // Cite renders an anchor to #ref-N and RefItem carries that id, so a cite
    // with no entry is a link that jumps nowhere.
    const dangling = Array.from(document.querySelectorAll('a[href^="#ref-"]'))
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id));
    expect(dangling).toEqual([]);
  });

  it("discloses that the capstone panel is a composite, not a live model", () => {
    render(<Page19 />);
    expect(screen.getAllByText(/illustrative composite/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/not a live model/i).length).toBeGreaterThan(0);
  });

  it("states the serial-versus-parallel assumption the latency readout rests on", () => {
    render(<Page19 />);
    // Page 16 prints "every extra sample is also latency" for the same lever.
    // Both are true; neither used to say under what.
    expect(screen.getByText(/assumes N samples are drawn at the same time/i)).toBeInTheDocument();
    expect(screen.getByText(/latency tracks the bill/i)).toBeInTheDocument();
  });

  // ---- the close: this page has to pay page 2's debt, and used to end on a survey ----

  it("puts page 2's own question back in front of the reader", () => {
    render(<Page19 />);
    expect(screen.getByText(/The question you were asked on page 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Who won the most recent World Cup/i)).toBeInTheDocument();
  });

  it("answers it in halves, and says which half thinking cannot buy", () => {
    render(<Page19 />);
    expect(screen.getByText(/The misread question: settled/i)).toBeInTheDocument();
    const stale = screen.getByText(/not settled, and not settleable/i).closest("div")!;
    expect(stale.textContent).toMatch(/None of them\s+puts a fact in there that was never in there/);
    // ...and the lever that does reach it is the one that stops being a monologue.
    expect(screen.getByText(/fetch a fact it never memorized/i)).toBeInTheDocument();
  });

  it("answers page 1's stake in page 1's own terms", () => {
    render(<Page19 />);
    expect(
      screen.getByText(/recognizing an answer and constructing one are not the same act/i),
    ).toBeInTheDocument();
  });

  it("gives the reader something to carry out instead of three abstract bounds", () => {
    render(<Page19 />);
    expect(screen.getByText(/Three things to take with you/i)).toBeInTheDocument();
    expect(screen.getByText(/A score is a reading, not a property/i)).toBeInTheDocument();
    expect(screen.getByText(/Treat the trace as a witness, not a recording/i)).toBeInTheDocument();
  });

  it("no longer re-teaches pages 11 and 6 as prose recaps", () => {
    render(<Page19 />);
    const { textContent } = document.body;
    // The cut step opened by asserting the opposite of what page 11 does.
    expect(textContent).not.toMatch(/Act 2 spent the same budget on every question/i);
    // ...and reprinted page 6's own budget-forcing result.
    expect(textContent).not.toMatch(/appending .?Wait.? stretches thinking/i);
  });

  it("carries no em dash or en dash in rendered copy", () => {
    const { container } = render(<Page19 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });
});
