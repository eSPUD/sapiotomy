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
import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { PAGE8, pValue, pct } from "@/lib/page08";
import { PILE8 } from "@/lib/page08Pile";
import { Page8 } from "./Page8";

describe("Page 8 (best-of-N and verifiers) component", () => {
  it("opens by naming best-of-N against majority voting", () => {
    render(<Page8 />);
    const lede = screen.getByText(/Chain of thought lets a model reason through a problem/);
    expect(lede.textContent).toMatch(/Majority voting/);
    expect(lede.textContent).toMatch(/Best-of-N sampling/);
  });

  it("draws all three beats", () => {
    render(<Page8 />);
    expect(screen.getByRole("heading", { name: /Generate, judge, keep the best/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Best-of-N on \d+ problems/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /What a judge is worth/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Chain of thought, majority vote, Best-of-N/ })).toBeInTheDocument();
  });

  // Figure 3: the bars are the rows' averages, and the page does not call the
  // vote-against-Best-of-N gap a difference when it is a handful of problems.
  it("compares the three methods on the same chains, and calls the two level", () => {
    render(<Page8 />);
    const caption = screen.getByText(/Both ways of choosing beat one chain/);
    const { best_vs_vote: bv } = PILE8.bars;
    expect(caption.textContent).toContain(`they disagree on only ${bv.best_only + bv.vote_only} problems`);
    expect(bv.p).toBeGreaterThan(0.05);
    expect(caption.textContent).toMatch(/not a difference/);
    const chart = within(caption.closest("figure")!).getByRole("img");
    expect(chart.getAttribute("aria-label")).toContain(pct(PILE8.bars.vote));
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

  it("states the cost in one sentence", () => {
    render(<Page8 />);
    const cost = screen.getByText(/Best-of-N costs what majority voting costs/);
    expect(cost.textContent).toMatch(/plus a second model that reads each of them once/);
  });

  // The checkpoint had to be rebuilt from its published weights, and that is a
  // fact about the apparatus rather than about selection. It lives in the
  // notebook and the download now; the page does not stop to litigate it.
  it("leaves the rebuild of the checkpoint to the notebook", () => {
    render(<Page8 />);
    expect(screen.queryByText(/did not run as published/)).toBeNull();
    expect(document.body.textContent).not.toMatch(/rebuilt|published weights/);
  });

  // Provenance is pills at the figures, not the plate this page used to open
  // on. What survives the move is the claim, not the apparatus: every figure
  // says it is measured, the first one names the model and the problems, and
  // the evidence figure says the rules read the same chains, which is what lets
  // its rows be compared at all.
  it("marks every figure as measured, at the figure", () => {
    render(<Page8 />);
    // Counted over the pills themselves: figure 4's gutter also says "measured
    // here" under the one solve rate that was, and that is not a figure pill.
    const pills = Array.from(document.querySelectorAll("li")).filter((li) =>
      /^measured/.test(li.textContent ?? ""),
    );
    // Section 1's old card, the heat map, the bars, and the judge ladder.
    expect(pills).toHaveLength(4);
    const first = screen.getByText(`measured ${PAGE8.run.date}`);
    const row = first.closest("ul")!;
    // Page 7's two facts: which model, which problems. Named, not implied.
    expect(row.textContent).toContain(PAGE8.run.model.split("/").pop());
    expect(row.textContent).toContain(`${PAGE8.run.items} MATH-500 problems`);
    // The heat map names its own model and problem count.
    const heat = screen.getByText(`${PILE8.rows.length} MATH-500 problems, ${PILE8.nChains} chains each`);
    expect(heat.closest("ul")!.textContent).toContain(PILE8.writer.split("/").pop());
    // The sister's-age demo is the one authored figure, and it is the only
    // thing on the page allowed to say so.
    expect(document.body.textContent).not.toMatch(/simulation/i);
    const illustrative = screen.getByText(/illustrative/i);
    expect(illustrative.closest("section")).toBe(screen.getByLabelText("Four chains, judged"));
  });

  it("plays the demo in one press: generate, judge one chain at a time, keep the best", () => {
    vi.useFakeTimers();
    try {
      render(<Page8 />);
      const demo = screen.getByLabelText("Four chains, judged");
      const tick = () => act(() => vi.advanceTimersByTime(1_000));
      expect(within(demo).queryByText(/Final answer/)).toBeNull();
      fireEvent.click(within(demo).getByRole("button", { name: /Play/ }));
      expect(within(demo).getByText("Generating…")).toBeInTheDocument();
      // One tick per step, so each state renders before the next timer is set.
      for (let i = 0; i < 5; i++) tick();
      expect(within(demo).getAllByText(/^chain \d$/)).toHaveLength(4);
      expect(within(demo).getByText("Judging…")).toBeInTheDocument();
      // The judge reads one chain at a time: the first is being read, none rated.
      expect(within(demo).getByText("reading…")).toBeInTheDocument();
      expect(within(demo).queryByText(/% right/)).toBeNull();
      for (let i = 0; i < 6; i++) tick();
      expect(within(demo).getAllByText(/% right/)).toHaveLength(4);
      expect(within(demo).getByText("Best candidate selected")).toBeInTheDocument();
      expect(within(demo).getByText(/Best of 4 keeps chain 2/).textContent).toMatch(/67/);
      // The mechanism only: page 7's vote is not in this figure.
      expect(demo.textContent).not.toMatch(/vote/i);
      fireEvent.click(within(demo).getByRole("button", { name: /Reset/ }));
      expect(within(demo).queryByText(/Final answer/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  // The rest of what the plate carried opened the page in the notebook's own
  // language. None of it is actionable on the page, all of it is in the
  // download on the top line.
  it("prints no run id, token cap or test name at the reader", () => {
    render(<Page8 />);
    const body = document.body.textContent ?? "";
    expect(body).not.toContain(PAGE8.run.runId);
    expect(body).not.toContain(String(PAGE8.run.chainCap));
    expect(body).not.toMatch(/McNemar|GPU|\bT =|\bN=|levels 4 and 5/);
  });

  // The main evidence figure used to print `best-of-N (qwen1.5b)` and `logprob`
  // at a reader. Every row is now English, and the map is the only place a new
  // judge can be named.
  it("labels every selection rule in English, never a notebook identifier", () => {
    render(<Page8 />);
    for (const j of PAGE8.judges) {
      expect(j.label).not.toMatch(/prm$|^qwen|^math\d/);
    }
    expect(document.body.textContent).not.toMatch(/logprob|qwen1\.5b|skywork-prm/);
  });

  // The repository is never named in the deck (Page5.test.tsx, Page7.test.tsx),
  // and neither is a chapter of it. The source itself is now cited, because it
  // owns a row of the evidence figure and two sentences of that figcaption.
  it("cites the source whose scorer owns a row, without naming a chapter of it", () => {
    render(<Page8 />);
    expect(document.body.textContent).not.toMatch(/ch0\d/);
    expect(document.body.textContent).not.toContain("reasoning-from-scratch");
    const source = screen.getByRole("link", { name: /Build a Reasoning Model \(From Scratch\)/ });
    expect(source).toHaveAttribute("href", "https://mng.bz/lZ5B");
    // Reachable from the close, which credits the comparison to us.
    const entry = source.closest("p")!;
    expect(document.querySelector(`a[href='#${entry.id}']`)).not.toBeNull();
  });

  it("says what a verifier is where the word first appears", () => {
    render(<Page8 />);
    const first = screen.getByText(/trained to score finished solutions rather than to write them/);
    expect(first).toBeInTheDocument();
    // Before the figure that plots its scores, and before step 3's caption.
    const body = document.body.textContent ?? "";
    expect(body.indexOf("trained to score finished solutions")).toBeLessThan(
      body.indexOf("Being good at solving the problems"),
    );
  });

  // The run refuses to call the judge ordering resolved, and this is the page
  // that quotes a p-value for everything else. The caption was rewritten on
  // 2026-08-09 and now hedges by attributing the ordering to this run rather
  // than by spelling out the overlap; the figure's own description still says
  // no pair is resolved, and that is where the assertion moved to.
  it("does not state the judge ranking as resolved", () => {
    render(<Page8 />);
    expect(PAGE8.claims.judge_ranking_resolved).toBe(false);
    const reading = screen.getByText(/Being good at solving the problems/).closest("p");
    expect(reading?.textContent).toMatch(/This run shows/);
    // Nothing interprets the chart from inside its box.
    expect(reading?.closest("figure")).toBeNull();
    const chart = screen.getByLabelText(/Five judges, ordered by what each solves/);
    expect(chart.getAttribute("aria-label")).toMatch(/no pair of\s+judges is resolved/);
  });

  // The solve-rate column is not one measurement: most of it is page 6's greedy
  // run and one row was measured here. The provenance rides with each number
  // rather than being flattened into one axis a reader compares straight across.
  it("says where each judge's solve rate came from", () => {
    render(<Page8 />);
    const shown = PAGE8.judges.map((j) => j.solvesSourceLabel).filter(Boolean);
    for (const label of shown) {
      expect(screen.getAllByText(label!).length).toBeGreaterThan(0);
    }
    // More than one source, or there is nothing for the figure to disclose.
    expect(new Set(shown).size).toBeGreaterThan(1);
    const chart = screen.getByLabelText(/Five judges, ordered by what each solves/);
    expect(chart.getAttribute("aria-label")).toMatch(/not one measurement/);
  });

  // Two judges out-solve the model whose candidates they grade, and the run
  // keeps a gate for it. Without this the ladder reads as evidence about
  // judging alone.
  it("says which judges out-solve the model they judge", () => {
    render(<Page8 />);
    const stronger = PAGE8.judges.filter((j) => j.strongerThanWriter);
    expect(stronger.length).toBeGreaterThan(0);
    expect(PAGE8.writerSolves).not.toBeNull();
    const line = screen.getByText(/solve more of these problems than the model that wrote/);
    for (const j of stronger) expect(line.textContent).toContain(j.label);
    expect(line.textContent).toContain(pct(PAGE8.writerSolves!));
    // And the gate that survives ruling them out.
    expect(PAGE8.claims.best_of_n_beats_counting_without_a_stronger_generator).toBe(false);
    expect(line.textContent).toMatch(/still no better than the vote/);
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

  // The two sources moved from CitationBadge chips into numbered RefItem entries
  // in their margin notes, each reachable from an inline Cite superscript in the
  // prose. References carry no preprint tag.
  it("cites Cobbe and Stroebl as numbered references with inline markers", () => {
    render(<Page8 />);
    const cobbe = screen.getByRole("link", {
      name: /Training Verifiers to Solve Math Word Problems/,
    });
    expect(cobbe).toHaveAttribute("href", "https://arxiv.org/abs/2110.14168");
    const stroebl = screen.getByRole("link", { name: /Inference Scaling fLaws/ });
    expect(stroebl).toHaveAttribute("href", "https://arxiv.org/abs/2411.17501");
    // References carry no preprint tag.
    expect(screen.queryByText("preprint")).toBeNull();
    // Each source carries an inline superscript marker pointing at its entry.
    for (const n of [1, 2, 3]) {
      expect(document.querySelector(`a[href='#ref-${n}']`)).not.toBeNull();
      expect(document.getElementById(`ref-${n}`)).not.toBeNull();
    }
  });

  it("links the notebook and traces for download", () => {
    render(<Page8 />);
    const link = screen.getByRole("link", { name: /download the notebook/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-08-best-of-n.zip");
  });

  // Figure 2: every problem as a row of its chains in the judge's order.
  it("draws every problem's chains in the judge's order, the kept one first", () => {
    render(<Page8 />);
    const cells = screen.getAllByRole("button", { name: /^problem \d+, / });
    expect(cells).toHaveLength(PILE8.rows.length * PILE8.nChains);
    const kept = screen.getAllByRole("button", { name: /kept chain/ });
    expect(kept).toHaveLength(PILE8.rows.length);
    // The kept column's right count is Best-of-N's accuracy.
    expect(kept.filter((b) => /right$/.test(b.getAttribute("aria-label")!)).length).toBe(
      Math.round(PILE8.bars.best_of_n * PILE8.rows.length),
    );
    const caption = screen.getByText(/The problems fall into three bands/);
    expect(caption.textContent).toContain(`right on ${PILE8.bands.mixedKeptRight}`);
    expect(PILE8.bands.all + PILE8.bands.mixed + PILE8.bands.none).toBe(PILE8.rows.length);
  });

  it("opens a chain's text when its cell is clicked", async () => {
    render(<Page8 />);
    const row = PILE8.rows[PILE8.rows.length - 1];
    fireEvent.click(screen.getAllByRole("button", { name: /kept chain/ }).at(-1)!);
    const head = screen.getByText(/The kept chain · answer/);
    expect(head.textContent).toContain(`the judge rated it ${row.chains[0].r}%`);
    await waitFor(() => expect(screen.queryByText("loading…")).toBeNull());
  });

  // Deck-wide copy rule. Pages 5, 6 and 7 each carry this assertion; page 8 did
  // not, which is how one survived in the lede.
  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page8 />);
    expect(document.body.textContent).not.toContain("\u2014");
    expect(document.body.textContent).not.toContain("\u2013");
  });
});
