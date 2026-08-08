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

  // Provenance is pills at the figures, not the plate this page used to open
  // on. What survives the move is the claim, not the apparatus: every figure
  // says it is measured, the first one says what and when, and the evidence
  // figure says the rules read the same chains, which is what lets its rows be
  // compared at all.
  it("marks every figure as measured, at the figure", () => {
    render(<Page8 />);
    expect(screen.getAllByText(/^measured/).length).toBe(3);
    const first = screen.getByText(`measured ${PAGE8.run.date}`);
    const row = first.closest("ul")!;
    expect(row.textContent).toContain(PAGE8.run.model.split("/").pop());
    expect(row.textContent).toContain(`${PAGE8.run.items} problems`);
    expect(screen.getByText("every rule reads the same chains")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/illustrative|simulation/i);
  });

  // The plate opened the page in the notebook's own language. None of it is
  // actionable on the page, all of it is in the download on the top line.
  it("prints no run id, token cap or test name at the reader", () => {
    render(<Page8 />);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(PAGE8.run.runId);
    expect(body).not.toContain(String(PAGE8.run.chainCap));
    expect(body).not.toMatch(/McNemar|MATH-500|GPU|\bT =|\bN=/);
  });

  // The main evidence figure used to print `best-of-N (qwen1.5b)` and `logprob`
  // at a reader. Every row is now English, and the map is the only place a new
  // judge can be named.
  it("labels every selection rule in English, never a notebook identifier", () => {
    render(<Page8 />);
    for (const r of PAGE8.paired.vsOneChain) {
      // getAll: "majority vote" is also figure 1's legend and figure 3's bar.
      expect(screen.getAllByText(r.label).length).toBeGreaterThan(0);
      expect(r.label).not.toContain("(");
    }
    for (const j of PAGE8.judges) {
      expect(j.label).not.toMatch(/prm$|^qwen|^math\d/);
    }
    expect(document.body.textContent).not.toMatch(/logprob|qwen1\.5b|skywork-prm/);
  });

  // The book is never named in the deck (Page5.test.tsx, Page7.test.tsx), so a
  // chapter of it cannot be either.
  it("names no chapter of a source the reader cannot see", () => {
    render(<Page8 />);
    expect(document.body.textContent).not.toMatch(/ch0\d/);
    expect(document.body.textContent).not.toContain("reasoning-from-scratch");
    expect(screen.getByText(/heuristic scorer from the source we build on/)).toBeInTheDocument();
  });

  it("says what a verifier is where the word first appears", () => {
    render(<Page8 />);
    const first = screen.getByText(/trained to score finished solutions rather than to write them/);
    expect(first).toBeInTheDocument();
    // Before the figure that plots its scores, and before step 3's caption.
    const body = document.body.textContent ?? "";
    expect(body.indexOf("trained to score finished solutions")).toBeLessThan(
      body.indexOf("Being good at the problems"),
    );
  });

  // The run refuses to call the judge ordering resolved, and this is the page
  // that quotes a p-value for everything else.
  it("does not state the judge ranking as resolved", () => {
    render(<Page8 />);
    expect(PAGE8.claims.judge_ranking_resolved).toBe(false);
    const caption = screen.getByText(/Being good at the problems/).closest("figcaption");
    expect(caption?.textContent).toMatch(/on this run/);
    expect(caption?.textContent).toMatch(/no pair of judges here is resolved/);
  });

  // Page 7 hands over a question. It gets answered in words, not just in a figure.
  it("answers page 7 on what judging recovers", () => {
    render(<Page8 />);
    const trained = PAGE8.judges.find((j) => j.trained)!;
    const close = screen.getByText(/leftovers are still mostly leftovers/);
    expect(close.textContent).toContain(pct(PAGE8.coverage!));
    expect(close.textContent).toContain(pct(PAGE8.bar.mean));
    expect(close.textContent).toContain(pct(trained.mean));
  });

  // Page 7 used to claim page 8 reused its chains. It did not, and the receipt
  // for what actually holds is on this page.
  it("shows the agreement with page 7 rather than claiming identity", () => {
    render(<Page8 />);
    expect(PAGE8.agreement.sameCandidates).toBe(false);
    const note = screen.getByText(/chains this page generated itself/);
    expect(note.textContent).toContain(pct(PAGE8.agreement.page7Vote));
    expect(note.textContent).toContain(pct(PAGE8.agreement.page8Vote));
    expect(note.textContent).toContain(pct(PAGE8.agreement.page8Coverage));
  });

  // The two sources moved from CitationBadge chips into numbered RefItem entries
  // in their margin notes, each reachable from an inline Cite superscript in the
  // prose. Both are non-peer-reviewed, so both keep the preprint flag.
  it("cites Cobbe and Stroebl as numbered references with inline markers", () => {
    render(<Page8 />);
    const cobbe = screen.getByRole("link", {
      name: /Training Verifiers to Solve Math Word Problems/,
    });
    expect(cobbe).toHaveAttribute("href", "https://arxiv.org/abs/2110.14168");
    const stroebl = screen.getByRole("link", { name: /Inference Scaling fLaws/ });
    expect(stroebl).toHaveAttribute("href", "https://arxiv.org/abs/2411.17501");
    expect(screen.getAllByText("preprint")).toHaveLength(2);
    // Each source carries an inline superscript marker pointing at its entry.
    expect(document.querySelector("a[href='#ref-1']")).not.toBeNull();
    expect(document.querySelector("a[href='#ref-2']")).not.toBeNull();
    expect(document.getElementById("ref-1")).not.toBeNull();
    expect(document.getElementById("ref-2")).not.toBeNull();
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
