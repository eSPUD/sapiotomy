import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Page7 } from "./Page7";
import { PAGE7, chainsFor, foldTrace, tidyMath } from "@/lib/page07";

/**
 * The page renders from a committed run and nothing streams or simulates, so
 * these assertions target the measured numbers and the two places the page is
 * most likely to drift into saying more than the run supports: the baseline the
 * headline is measured against, and the fixed-budget result that did not go the
 * spec's way.
 */
describe("Page 7 (frequency voting) component", () => {
  /** Figure 2's N control is a rule on the chart, moved here with its own keys. */
  const nControl = () => screen.getByRole("slider", { name: /# of sampled chains/ });
  const setVoters = (i: number) => {
    fireEvent.keyDown(nControl(), { key: "Home" });
    for (let k = 0; k < i; k++) fireEvent.keyDown(nControl(), { key: "ArrowRight" });
  };
  it("quotes the headline against BARE CHAIN OF THOUGHT, not against a sampled chain", () => {
    render(<Page7 />);
    // 43% is page 5's `bare` and page 6's top rung. If the page ever quotes the
    // sampled baseline here instead, the gain silently becomes 4 points and stops
    // being significant.
    const headline = screen.getByText(/One greedy chain solves/i).closest("p")!;
    expect(within(headline).getByText("43%")).toBeInTheDocument();
    expect(headline.textContent).toMatch(
      /12 points\s+less than majority voting with 16 sampled chains/,
    );
    // and the 12 is the gap the run tested, against the greedy chain
    expect(PAGE7.figure2.gain.gain_pts).toBeCloseTo(12, 6);
    expect(PAGE7.figure2.gain.p).toBeLessThan(0.05);
  });

  // The guard on the +12 (some of it is sampling, not counting) is carried by the
  // figure now. The vote line starts at ONE sampled chain, which already sits above
  // the flat greedy line before any vote is taken, and the readout there says so.
  it("shows in figure 2 that sampling alone is part of the gain", () => {
    render(<Page7 />);
    const one = PAGE7.figure2.hot.points[0];
    expect(one.n).toBe(1);
    expect(one.accuracy).toBeGreaterThan(PAGE7.figure2.cold.points[0].accuracy);
    setVoters(0);
    const live = document.querySelector("p[aria-live='polite']")!;
    expect(live.textContent).toMatch(/no vote yet/);
    expect(live.textContent).toMatch(/above one greedy chain/);
  });

  const tallyRows = () =>
    within(screen.getByRole("list", { name: /Answers to this problem/i })).getAllByRole("button");
  const chainPosition = () => screen.getByText(/^chain \d+ of \d+$/).textContent;

  it("draws the tally with one row per distinct answer and no 'other' bucket", () => {
    render(<Page7 />);
    const s = PAGE7.figure1.specimen;
    expect(tallyRows()).toHaveLength(s.ranked.length);
    expect(s.ranked.filter((r) => r.votes === 1).length).toBeGreaterThan(0);
  });

  it("opens a row and shows the chains that landed there", () => {
    render(<Page7 />);
    const second = PAGE7.figure1.specimen.ranked[1];
    fireEvent.click(tallyRows()[1]);
    expect(tallyRows()[1]).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(new RegExp(`${second.votes} of ${PAGE7.figure1.n_chains} chains`)),
    ).toBeInTheDocument();
  });

  // A row is a place in the tally, not a switch. Clicking the open row a second time
  // used to close it, which hid the chain the reader was in the middle of.
  it("keeps a row open when it is clicked again", () => {
    render(<Page7 />);
    fireEvent.click(tallyRows()[1]);
    const before = screen.getByTestId("chain-trace").textContent;
    fireEvent.click(tallyRows()[1]);
    fireEvent.doubleClick(tallyRows()[1]);
    expect(tallyRows()[1]).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("chain-trace").textContent).toBe(before);
  });

  it("offers three problems, one for each way a vote can end", () => {
    render(<Page7 />);
    const picker = screen.getByRole("radiogroup", { name: /Pick a problem/i });
    const choices = within(picker).getAllByRole("radio");
    expect(choices.map((b) => b.getAttribute("aria-label"))).toEqual([
      "the vote is right",
      "the vote is wrong",
      "the vote ties",
    ]);
    expect(choices[0]).toBeChecked();
    for (const [i, { problem }] of PAGE7.figure1.showcase.entries()) {
      fireEvent.click(choices[i]);
      expect(tallyRows()).toHaveLength(problem.ranked.length);
      // Each problem opens on its correct answer, even where the vote picked a wrong one.
      const right = problem.ranked.findIndex((r) => r.correct);
      expect(right).toBeGreaterThanOrEqual(0);
      expect(tallyRows()[right]).toHaveAttribute("aria-expanded", "true");
      expect(chainPosition()).toBe(`chain 1 of ${problem.ranked[right].votes}`);
      expect(screen.getByText(/of 16 chains · correct$/)).toBeInTheDocument();
    }
  });

  // The arrows belong to the open answer: "64" has eight chains to step through and
  // "128" has two. They never wander into another row.
  it("steps only through the chains of the open answer", () => {
    render(<Page7 />);
    const s = PAGE7.figure1.specimen;
    for (const [r, row] of s.ranked.entries()) {
      fireEvent.click(tallyRows()[r]);
      const next = screen.getByRole("button", { name: "Next chain" });
      expect(screen.getByRole("button", { name: "Previous chain" })).toBeDisabled();
      const want = chainsFor(s, row.answer).map((c) => String(c.sample_index));
      const seen: string[] = [];
      for (let k = 0; k < row.votes; k++) {
        expect(chainPosition()).toBe(`chain ${k + 1} of ${row.votes}`);
        seen.push(screen.getByTestId("chain-trace").getAttribute("data-chain")!);
        if (k < row.votes - 1) fireEvent.click(next);
      }
      expect(next).toBeDisabled();
      expect(seen).toEqual(want);
      expect(tallyRows()[r]).toHaveAttribute("aria-expanded", "true");
    }
  });

  // Every chain of every problem is readable, the wrong ones as much as the right ones.
  // The reader used to see at most two chains per answer.
  it("puts every chain of every problem within reach, wrong ones included", () => {
    render(<Page7 />);
    const choices = within(screen.getByRole("radiogroup", { name: /Pick a problem/i })).getAllByRole(
      "radio",
    );
    for (const [i, { problem }] of PAGE7.figure1.showcase.entries()) {
      fireEvent.click(choices[i]);
      const seen = new Set<string>();
      for (const [r, row] of problem.ranked.entries()) {
        fireEvent.click(tallyRows()[r]);
        for (let k = 0; k < row.votes; k++) {
          seen.add(screen.getByTestId("chain-trace").getAttribute("data-chain")!);
          fireEvent.click(screen.getByRole("button", { name: "Next chain" }));
        }
      }
      expect(problem.chains.some((c) => !c.correct)).toBe(true);
      expect([...seen].sort()).toEqual(problem.chains.map((c) => String(c.sample_index)).sort());
    }
  });

  // Chains run to 272 lines. The reader sees the opening and the ending, which is
  // where the chain commits to its answer, and opens the middle on request.
  it("folds a long chain to its opening and its ending", () => {
    render(<Page7 />);
    const chain = chainsFor(PAGE7.figure1.specimen, PAGE7.figure1.specimen.ranked[0].answer)[0];
    const { head, middle, tail } = foldTrace(tidyMath(chain.trace));
    expect(middle.length).toBeGreaterThan(0);
    const trace = () => screen.getByTestId("chain-trace").textContent ?? "";
    expect(trace()).toContain(head[0]);
    expect(trace()).toContain(tail[tail.length - 1]);
    expect(trace()).not.toContain(middle[Math.floor(middle.length / 2)]);
    fireEvent.click(screen.getByRole("button", { name: "Show reasoning traces" }));
    expect(trace()).toContain(middle[Math.floor(middle.length / 2)]);
    // the next chain opens folded again
    fireEvent.click(screen.getByRole("button", { name: "Next chain" }));
    expect(
      screen.getByRole("button", { name: "Show reasoning traces" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("cuts a chain only at paragraph breaks and loses nothing", () => {
    for (const { problem } of PAGE7.figure1.showcase) {
      for (const c of problem.chains) {
        const text = tidyMath(c.trace);
        const { head, middle, tail } = foldTrace(text);
        const norm = (t: string) => t.replace(/\s+/g, " ").trim();
        expect(norm([...head, ...middle, ...tail].join("\n\n"))).toBe(norm(text));
      }
    }
  });

  it("steps with the arrow keys inside the card instead of turning the page", () => {
    render(<Page7 />);
    expect(PAGE7.figure1.specimen.ranked[0].votes).toBeGreaterThan(1);
    const next = screen.getByRole("button", { name: "Next chain" });
    const pageTurn = vi.fn();
    window.addEventListener("keydown", pageTurn);
    fireEvent.keyDown(next, { key: "ArrowRight" });
    expect(chainPosition()).toMatch(/^chain 2 of/);
    fireEvent.keyDown(next, { key: "ArrowLeft" });
    expect(chainPosition()).toMatch(/^chain 1 of/);
    expect(pageTurn).not.toHaveBeenCalled();
    window.removeEventListener("keydown", pageTurn);
  });

  it("names the three lines in plain English, not in the notebook's vocabulary", () => {
    render(<Page7 />);
    // "in the pile" / "the vote" / "T = 0" is how the notebook talks. A reader needs
    // to be told which line is what the model produced and which is what the vote kept.
    const chart = () => screen.getByRole("region", { name: /Accuracy against the number/ });
    expect(chart().textContent).toMatch(/majority\s*voting/i);
    expect(chart().textContent).toMatch(/one greedy\s*chain/i);
    fireEvent.click(screen.getByRole("button", { name: /Show what the vote threw away/ }));
    expect(chart().textContent).toMatch(/at least one\s*chain is right/i);
    // and the band between the last two must be named, because it is page 8
    expect(chart().textContent).toMatch(/generated, then thrown away/i);
  });

  // The figure opens on its claim, the vote rising off the flat line. What the vote
  // threw away is step 5's subject, so it is drawn on request rather than from the
  // start, and the toggle takes it away again.
  it("opens figure 2 on two lines and draws the third on request", () => {
    render(<Page7 />);
    expect(screen.queryByTestId("thrown-away")).toBeNull();
    const toggle = screen.getByRole("button", { name: /Show what the vote threw away/ });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(screen.getByTestId("thrown-away")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Hide what the vote threw away/ }));
    expect(screen.queryByTestId("thrown-away")).toBeNull();
  });

  // The widget is the chart and its controls. The headline, the band note and two
  // footnotes used to sit inside it; the figure has to carry the step on its own.
  it("keeps the headline and the explanations outside the figure 2 widget", () => {
    render(<Page7 />);
    const widget = screen.getByRole("region", { name: /Accuracy against the number/ });
    expect(widget.textContent).not.toMatch(/sampling alone|majority voting with|p = 0\./);
    expect(widget.textContent).not.toMatch(/The band widens/);
  });

  // The intro names the two drawn lines by the chart's own names, and does not explain
  // majority voting again: step 1's analogy does that.
  it("names the drawn lines the same way in the intro and on the chart", () => {
    render(<Page7 />);
    const intro = screen.getByText(/Just now, we saw majority voting/).closest("p")!;
    expect(intro.textContent).toMatch(/majority voting/);
    expect(intro.textContent).toMatch(/One greedy chain/);
    expect(intro.textContent).toMatch(/all 100 MATH-500 problems at\s+levels 4 and 5/);
    expect(intro.textContent).not.toMatch(/In the pile|the answer the most chains agreed on/);
  });

  // "Greedy" is load-bearing here and first explained on page 10. The fix is to tie the
  // word to what this page already says it is, not to import page 10's mechanism,
  // which docs/page_7_refactor.md:225-234 forbids at this altitude.
  it("ties the word greedy to the plain description it already gives", () => {
    render(<Page7 />);
    const intro = screen.getByText(/Just now, we saw majority voting/).closest("p")!;
    // the reader is told what it IS (one plain chain) before what it is called
    expect(intro.textContent).toMatch(
      /a single, pure chain of thought\?[\s\S]*against greedy decoding/,
    );
    expect(document.body.textContent).not.toMatch(/likeliest|probability distribution/i);
  });

  // Prose trims: each of these was said twice.
  it("says each thing once around figure 2", () => {
    render(<Page7 />);
    const body = document.body.textContent ?? "";
    expect(screen.getAllByText(/Click a row to read the chains/i)).toHaveLength(1);
    expect(body).not.toMatch(/never the first two/);
    // "turning it up makes them disagree more" is now the temperature gloss in step
    // 2's intro, said once. It may not also sit above the diversity numbers, where it
    // pre-narrated exactly what they show.
    expect(body.match(/makes them disagree more/g) ?? []).toHaveLength(1);
  });

  // Load-bearing on this page and first explained on page 10, so it gets an
  // operational gloss here and no mechanism: docs/page_7_refactor.md:225-234 keeps
  // tokens and probability distributions off this page.
  it("glosses temperature without importing page 10's mechanism", () => {
    render(<Page7 />);
    const intro = screen.getByText(/Here are three problems/).textContent ?? "";
    expect(intro).toMatch(/which is what temperature does/);
    expect(intro).toMatch(/at zero every chain comes back identical/);
    expect(intro).not.toMatch(/likel|distribution|logit/i);
  });

  it("explains the flat temperature-zero line rather than hiding it", () => {
    render(<Page7 />);
    // said under the chart, in the sentence that leads into the temperature card
    expect(screen.getByText(/One greedy chain solves/i).closest("p")!.textContent).toMatch(
      /At T = 0 every\s+chain gives the same answer, so there is\s+nothing to vote on/,
    );
  });

  // The dip is explained where the reader meets it: labelled on the chart, and the
  // readout at two chains names the ties. The prose sentence under the widget was cut.
  it("explains the dip at N = 2 as the tie rule", () => {
    render(<Page7 />);
    const widget = screen.getByRole("region", { name: /Accuracy against the number/ });
    expect(widget.textContent).toMatch(/ties/);
    const two = PAGE7.figure2.hot.points.findIndex((p) => p.n === 2);
    setVoters(two);
    const live = document.querySelector("p[aria-live='polite']")!;
    expect(live.textContent).toMatch(
      new RegExp(`${Math.round(PAGE7.figure2.hot.points[two].tie_rate * 100)}% of these votes tie`),
    );
  });

  it("blames the CAP rather than the split, which is what the data says", () => {
    render(<Page7 />);
    // The spec wanted an interior optimum and the run did not give one. But the
    // reason matters: dividing a fixed budget shortens the chains, and a chain that
    // short scores 7% on its own. Saying "splitting loses" without saying why would
    // read as "voting loses", which the pile disproves.
    expect(PAGE7.claims.splitting_a_fixed_budget_pays).toBe(false);
    expect(screen.getByText(/Splitting is not what fails, capping is\./i)).toBeInTheDocument();
    // The cost claim stays bounded to the two arms this run actually has.
    //
    // The caption's closing sentence about page 6's arm was cut on 2026-08-10 by
    // request, and with it the positive assertion that used to sit here. The two
    // NEGATIVE guards below are the ones that matter and they stay: the page may
    // not claim there is no cheaper route, and it may not say the pushed chain
    // refuses to continue, which would contradict page-06-derived.json, where mean
    // tokens run 693.0 up to 1251.8 under injection.
    const body = document.body.textContent ?? "";
    expect(body).toContain("There are two ways of spending here");
    expect(body).not.toMatch(/no cheaper way to buy it/i);
    expect(body).not.toMatch(/refuse to continue/i);
  });

  // The sweep does not single out one temperature: plurality accuracy ties at the top.
  // The card has to carry the tie, or it claims a falloff the data does not show.
  it("reports the temperature sweep's tie rather than a falloff it does not show", () => {
    render(<Page7 />);
    const best = Math.max(...PAGE7.figure2.diversity.map((d) => d.plurality_accuracy));
    const tied = PAGE7.figure2.diversity.filter(
      (d) => Math.abs(d.plurality_accuracy - best) < 1e-9,
    );
    expect(tied.length).toBeGreaterThan(1);
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/past T = 0\.3 each chain gets worse/);
    for (const d of tied) expect(body).toContain(`T = ${d.temperature}`);
    expect(body).toMatch(/the vote comes out the same at T = \S+\s+and T = /);
    // "and worse above that" has to be true of every hotter setting
    const hottestTied = Math.max(...tied.map((d) => d.temperature));
    for (const d of PAGE7.figure2.diversity.filter((d) => d.temperature > hottestTied)) {
      expect(d.plurality_accuracy).toBeLessThan(best);
    }
  });

  // The headline leads into the temperature card, and the sentence that does it makes
  // two claims the run has to keep true: at T = 0 there is exactly one answer, and the
  // vote's gain over the greedy chain vanishes there (the flat line).
  it("leads from the headline into the temperature card on claims the run supports", () => {
    render(<Page7 />);
    const headline = screen.getByText(/One greedy chain solves/i).closest("p")!;
    expect(headline.textContent).toMatch(/exist only\s+because the chains disagree/);
    expect(headline.textContent?.trimEnd()).toMatch(/Here is by\s+how much:$/);
    expect(headline.nextElementSibling?.textContent).toMatch(/different answers among/);
    const cold = PAGE7.figure2.diversity.find((d) => d.temperature === 0)!;
    expect(cold.mean_distinct).toBe(1);
    for (const p of PAGE7.figure2.cold.points) {
      expect(p.accuracy).toBeCloseTo(PAGE7.figure2.gain.bare_cot, 9);
    }
  });

  // A small unboxed figure under the paragraph, not a second card: one bar per
  // temperature on a fixed 0 to n_chains scale, so the widths are comparable counts.
  it("draws the temperature sweep as bars on a fixed scale, outside any card", () => {
    render(<Page7 />);
    const fig = screen.getByRole("figure", { name: /Different answers among 8 chains/ });
    expect(fig.className).not.toMatch(/border|bg-surface/);
    const bars = within(fig).getAllByTestId("diversity-bar");
    const sweep = [...PAGE7.figure2.diversity].sort((a, b) => a.temperature - b.temperature);
    expect(bars).toHaveLength(sweep.length);
    for (const [i, d] of sweep.entries()) {
      expect(Number(bars[i].getAttribute("data-value"))).toBe(d.mean_distinct);
      expect(bars[i].textContent).toContain(`T = ${d.temperature}`);
      expect(bars[i].textContent).toContain(d.mean_distinct.toFixed(1));
    }
  });

  it("labels the diversity readout as a count on its own smaller item set", () => {
    render(<Page7 />);
    expect(screen.getByText(/count of answers, not an\s+accuracy/i)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`Averaged over ${PAGE7.figure2.diversity[0].n_items} problems`)),
    ).toBeInTheDocument();
    expect(PAGE7.figure2.diversity[0].n_items).toBeLessThan(PAGE7.manifest.items.n);
  });

  it("shows capped against uncapped at the SAME number of chains", () => {
    render(<Page7 />);
    // The comparison that isolates the cap from the split. Without it the panel is
    // two experiments that differ in two ways at once.
    // The phrase is in the column header and again in the caption, deliberately.
    expect(screen.getAllByText(/allowed to finish/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/cut off/i).length).toBeGreaterThan(0);
    // and the capped column must actually carry the 100% that explains the panel
    const worst = PAGE7.figure2.split[PAGE7.figure2.split.length - 1];
    expect(worst.truncated_rate).toBeCloseTo(1, 2);
  });

  it("agrees with itself where the two axes share a configuration", () => {
    // One chain is one chain. The notebook used to read this point two different ways
    // and put 51% and 46% on the same page.
    const split1 = PAGE7.figure2.split.find((s) => s.n === 1)!;
    const pile1 = PAGE7.figure2.hot.points.find((p) => p.n === 1)!;
    expect(split1.accuracy).toBeCloseTo(pile1.accuracy, 10);
  });

  // The voter control's readout quotes the same thrown-away share at N = 16, which is
  // the agreement we want and not a duplicate claim, so this pins the handoff by its
  // own sentence rather than by the number being unique on the page.
  it("closes on the number page 8 opens on", () => {
    render(<Page7 />);
    const handoff = screen.getByText(/the vote discarded it/i);
    expect(handoff).toBeInTheDocument();
    expect(handoff.textContent).toMatch(/23%/);
  });

  // There is no provenance plate. The instrument used to open the page as a mono
  // specimen label above step 1, apparatus before idea. The download carries the
  // run now, and the two facts a reader needs from it are on the figures.
  it("names the model and the benchmark on the figures that use them", () => {
    render(<Page7 />);
    expect(screen.getByRole("link", { name: /Download the notebook/i })).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    // figure 1's specimen card and figure 2's intro, both visible copy.
    expect(text).toContain(PAGE7.primary.label);
    expect(text).toContain("MATH-500");
    expect(text).toContain("levels 4 and 5");
    expect(text).not.toContain("reasoning-from-scratch");
  });

  it("keeps the retired provenance plate off the page", () => {
    render(<Page7 />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("one measurement of ours");
    expect(text).not.toContain(PAGE7.manifest.run_id);
    // The apparatus the plate's mono line carried belongs to the notebook.
    expect(text).not.toMatch(/top-p/i);
    expect(text).not.toContain(PAGE7.primary.precision ?? "bf16");
  });

  it("cites the technique without attaching a number to it", () => {
    render(<Page7 />);
    // The cite sits in the references note and in the badge row; neither may carry a figure.
    const badges = screen.getAllByText(/Wang et al\. 2022/);
    expect(badges.length).toBeGreaterThan(0);
    for (const b of badges) expect(b.textContent).not.toMatch(/\d+%/);
  });

  // Deck-wide copy rule, and the reason it is only being added now: pages 5 and
  // 6 carried this test and page 7 did not, so four em dashes survived a rebuild
  // here that would have failed on either neighbour.
  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page7 />);
    expect(document.body.textContent).not.toContain("\u2014");
    expect(document.body.textContent).not.toContain("\u2013");
  });

  it("does not reintroduce the simulation the refactor removed", () => {
    render(<Page7 />);
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/modelled/i);
    expect(body).not.toMatch(/illustrative/i);
    expect(screen.queryByRole("slider", { name: /temperature/i })).toBeNull();
  });

  /**
   * The page's subject is what happens as you add voters, and until now it had no
   * control that adds one: the reader had to read "does the vote still beat one
   * chain at N = 4?" off a static line. These pin the control and, more
   * importantly, that it only ever lands on a measured point of the run's own N
   * axis. An interpolated readout here would be a simulation on a page whose
   * whole claim is that every number is measured.
   */
  // The control lives on the chart and speaks the axis's own numbers. It used to be a
  // separate slider whose labels were its positions (0 to 4) under an axis reading
  // 1 to 16.
  it("lets the reader set how many chains the vote sees, on the chart itself", () => {
    render(<Page7 />);
    const pts = PAGE7.figure2.hot.points;
    const chart = screen.getByRole("region", { name: /Accuracy against the number/ });
    expect(within(chart).getByRole("slider", { name: /# of sampled chains/ })).toBe(nControl());
    expect(nControl()).toHaveAttribute("aria-valuemin", String(pts[0].n));
    expect(nControl()).toHaveAttribute("aria-valuemax", String(pts[pts.length - 1].n));
    // opens on the finished result the prose above the chart quotes
    expect(nControl()).toHaveAttribute("aria-valuenow", String(pts[pts.length - 1].n));
    expect(chart.textContent).toContain("# of sampled chains");
    // and the old separate slider is gone
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    // every key lands on a measured N, never between two
    for (const [i, p] of pts.entries()) {
      setVoters(i);
      expect(nControl()).toHaveAttribute("aria-valuenow", String(p.n));
    }
    fireEvent.keyDown(nControl(), { key: "End" });
    expect(nControl()).toHaveAttribute("aria-valuenow", String(pts[pts.length - 1].n));
  });

  it("reads out only measured points of the run's own N axis", () => {
    render(<Page7 />);
    // Coverage is read out only while its line is drawn.
    fireEvent.click(screen.getByRole("button", { name: /Show what the vote threw away/ }));
    const live = document.querySelector("p[aria-live='polite']")!;
    for (const [i, p] of PAGE7.figure2.hot.points.entries()) {
      setVoters(i);
      const text = live.textContent;
      expect(text).toMatch(new RegExp(`${Math.round(p.accuracy * 100)}%`));
      expect(text).toMatch(new RegExp(`${Math.round(p.coverage * 100)}%`));
    }
  });

  // The question F64 says the reader could not ask. At N = 2 the tie rule puts the
  // vote BELOW the flat line, and the readout has to say so rather than describing
  // every position as a gain. The baseline is the greedy chain the chart draws; the
  // readout used to measure against one sampled chain, which the chart does not draw.
  it("owns the positions where the vote is behind the greedy chain", () => {
    render(<Page7 />);
    const pts = PAGE7.figure2.hot.points;
    const greedy = PAGE7.figure2.cold.points[0].accuracy;
    const live = document.querySelector("p[aria-live='polite']")!;
    const behind = pts.findIndex((p, i) => i > 0 && p.accuracy < greedy);
    expect(behind).toBeGreaterThan(0);
    setVoters(behind);
    expect(live.textContent).toMatch(/below one greedy chain/i);
    expect(live.textContent).toMatch(/tie/);
    const ahead = pts.findIndex((p, i) => i > 0 && p.accuracy > greedy);
    setVoters(ahead);
    expect(live.textContent).toMatch(/above one greedy chain/i);
    expect(live.textContent).not.toMatch(/one sampled chain/);
  });
});
