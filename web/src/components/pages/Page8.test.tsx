/**
 * Page 8's component tests.
 *
 * The old ones drove two sliders and asserted what a simulation returned. The
 * simulation is gone, so what is checked here instead is that the page states
 * its measured result, states its caveat, and does not overclaim: the numbers
 * on screen come from `PAGE8`, and the assertions below are written against
 * that rather than against literals, so a re-run that moves the numbers moves
 * the test with it and a re-run that changes the CONCLUSION fails it.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { PAGE8, pValue, pct } from "@/lib/page08";
import { Page8 } from "./Page8";

describe("Page 8 (best-of-N and verifiers) component", () => {
  it("leads with the measured gain over one chain", () => {
    render(<Page8 />);
    const lede = screen.getByText(/Counting asks what is most common/);
    expect(lede.textContent).toContain(pct(PAGE8.headline.accuracy));
    expect(lede.textContent).toContain(pct(PAGE8.oneChain));
    expect(lede.textContent).toContain(pValue(PAGE8.headline.p));
  });

  it("draws all three beats", () => {
    render(<Page8 />);
    expect(screen.getByRole("heading", { name: /Judge one batch two ways/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /fixed, and what it broke/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /What a judge is worth/ })).toBeInTheDocument();
  });

  it("shows a real batch where the vote loses and the verifier wins", () => {
    render(<Page8 />);
    const s = PAGE8.specimen;
    const panel = screen.getByLabelText("One problem's candidates, counted and scored");
    expect(within(panel).getByText(new RegExp(`${s.vote.votes} of ${s.n}`))).toBeInTheDocument();
    // The specimen must be a disagreement, or the panel is drawing nothing.
    expect(s.vote.correct).toBe(false);
    expect(s.verifier.correct).toBe(true);
  });

  it("opens the chain behind a candidate when it is clicked", () => {
    render(<Page8 />);
    expect(screen.getByText(/Click a dot to read the chain/)).toBeInTheDocument();
    const first = PAGE8.specimen.candidates[0];
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^chain ${first.sample_index},`) }));
    expect(screen.getByText(new RegExp(`chain ${first.sample_index} ·`))).toBeInTheDocument();
  });

  it("states the caveat rather than burying it: counting gets there too", () => {
    render(<Page8 />);
    const close = screen.getByText(/Selection works\. Against the same candidates/);
    expect(close.textContent).toContain(pValue(PAGE8.caveat.p));
    // The run does not resolve a difference, and the page must not imply one.
    expect(PAGE8.caveat.resolved).toBe(false);
    expect(close.textContent).toMatch(/not a difference/);
  });

  it("credits the counting-versus-selection comparison to us, not the literature", () => {
    render(<Page8 />);
    expect(
      screen.getByText(/introduced in different chapters of the source we build on/),
    ).toBeInTheDocument();
  });

  it("says the verifier is a PRM read as an outcome score", () => {
    render(<Page8 />);
    const note = screen.getByText(/process reward model read at the final token/);
    expect(note).toBeInTheDocument();
    expect(note.textContent).toMatch(/next page/);
  });

  it("carries a measured provenance chip, not an illustrative one", () => {
    render(<Page8 />);
    const chip = screen.getByText(/^measured ·/);
    expect(chip.textContent).toContain(PAGE8.run.model);
    expect(chip.textContent).toContain(PAGE8.run.date);
    expect(chip.textContent).not.toMatch(/illustrative|simulation/i);
  });

  it("links the notebook and traces for download", () => {
    render(<Page8 />);
    const link = screen.getByRole("link", { name: /notebook \+ .* traces/ });
    expect(link).toHaveAttribute("href", "/notebooks/page-08-best-of-n.zip");
  });

  it("names ch05's scorer as the rule that makes things worse", () => {
    render(<Page8 />);
    if (!PAGE8.heuristic) return;
    expect(PAGE8.heuristic.net).toBeLessThan(0);
    expect(screen.getByText(/shortest wins/)).toBeInTheDocument();
  });

  // Deck-wide copy rule. Pages 5, 6 and 7 each carry this assertion; page 8 did
  // not, which is how one survived in the lede.
  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page8 />);
    expect(document.body.textContent).not.toContain("\u2014");
    expect(document.body.textContent).not.toContain("\u2013");
  });
});
