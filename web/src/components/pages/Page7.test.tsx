import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Page7 } from "./Page7";
import { PAGE7 } from "@/lib/page07";

/**
 * The page renders from a committed run and nothing streams or simulates, so
 * these assertions target the measured numbers and the two places the page is
 * most likely to drift into saying more than the run supports: the baseline the
 * headline is measured against, and the fixed-budget result that did not go the
 * spec's way.
 */
describe("Page 7 (frequency voting) component", () => {
  it("quotes the headline against BARE CHAIN OF THOUGHT, not against a sampled chain", () => {
    render(<Page7 />);
    // 43% is page 5's `bare` and page 6's top rung. If the page ever quotes the
    // sampled baseline here instead, the gain silently becomes 4 points and stops
    // being significant.
    expect(screen.getByText(/One chain of chain-of-thought, decoded greedily/i)).toBeInTheDocument();
    const callout = screen.getByText(/decoded greedily/i).closest("div")!;
    expect(within(callout).getByText("43%")).toBeInTheDocument();
    expect(within(callout).getByText("55%")).toBeInTheDocument();
    expect(callout.textContent).toMatch(/\+12 points/);
    expect(callout.textContent).toMatch(/p = 0\.0075/);
  });

  it("keeps the unresolved sampled-chain contrast in the footnote, not the headline", () => {
    render(<Page7 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/against one .*sampled.* chain/i);
    expect(body).toMatch(/p = 0\.388/);
  });

  it("draws the tally with one row per distinct answer and no 'other' bucket", () => {
    render(<Page7 />);
    const s = PAGE7.figure1.specimen;
    const rows = screen.getAllByRole("button", { expanded: false });
    expect(rows).toHaveLength(s.ranked.length);
    expect(s.ranked.filter((r) => r.votes === 1).length).toBeGreaterThan(0);
  });

  it("opens a row and shows the chains that landed there", () => {
    render(<Page7 />);
    const top = PAGE7.figure1.specimen.ranked[0];
    const rows = screen.getAllByRole("button", { expanded: false });
    fireEvent.click(rows[0]);
    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`${top.votes} of ${PAGE7.figure1.n_chains} chains`)),
    ).toBeInTheDocument();
  });

  it("names the three lines in plain English, not in the notebook's vocabulary", () => {
    render(<Page7 />);
    // "in the pile" / "the vote" / "T = 0" is how the notebook talks. A reader needs
    // to be told which line is what the model produced and which is what the vote kept.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/at least one\s*chain is right/i);
    expect(body).toMatch(/the vote\s*returns it/i);
    expect(body).toMatch(/one greedy\s*chain/i);
    // and the band between the last two must be named, because it is page 8
    expect(body).toMatch(/generated, then thrown away/i);
  });

  it("explains the flat temperature-zero line rather than hiding it", () => {
    render(<Page7 />);
    expect(screen.getByText(/every chain is the same chain/i)).toBeInTheDocument();
  });

  it("explains the dip at N = 2 as the tie rule", () => {
    render(<Page7 />);
    // The phrase appears in the figure caption and again in the footnote, deliberately.
    expect(screen.getAllByText(/a tie returns no answer/i).length).toBeGreaterThan(0);
  });

  it("blames the CAP rather than the split, which is what the data says", () => {
    render(<Page7 />);
    // The spec wanted an interior optimum and the run did not give one. But the
    // reason matters: dividing a fixed budget shortens the chains, and a chain that
    // short scores 7% on its own. Saying "splitting loses" without saying why would
    // read as "voting loses", which the pile disproves.
    expect(PAGE7.claims.splitting_a_fixed_budget_pays).toBe(false);
    expect(screen.getByText(/Splitting is not what fails; capping is\./i)).toBeInTheDocument();
    expect(document.body.textContent).toContain("no cheaper way to buy it");
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

  it("closes on the number page 8 opens on", () => {
    render(<Page7 />);
    expect(screen.getByText(/23%/)).toBeInTheDocument();
    expect(screen.getByText(/the vote discarded it/i)).toBeInTheDocument();
  });

  it("labels the diversity readout as a count on its own smaller item set", () => {
    render(<Page7 />);
    expect(screen.getByText(/count of answers, not an\s+accuracy/i)).toBeInTheDocument();
  });

  // Provenance is a plate, not a row of pills: the instrument on one mono line
  // and the download as the only lit ink. The grading provenance went back to
  // the notebook with the rest of the retired footer.
  it("carries the provenance and the download", () => {
    render(<Page7 />);
    expect(screen.getByRole("link", { name: /Download the notebook/i })).toBeInTheDocument();
    expect(document.body.textContent).toContain(PAGE7.manifest.run_id);
    expect(document.body.textContent).toContain("one measurement of ours");
    expect(document.body.textContent).not.toContain("reasoning-from-scratch");
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
});
