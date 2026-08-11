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
    expect(body).toMatch(/sampled.* chain rather than a greedy one/i);
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
    expect(body).toMatch(/the vote returns\s*the answer/i);
    expect(body).toMatch(/one greedy\s*chain/i);
    // and the band between the last two must be named, because it is page 8
    expect(body).toMatch(/generated, then thrown away/i);
  });

  // The intro is the reading key for the central figure, so it has to use the chart's
  // own names. It named them "The vote / In the pile / T = 0" while the chart said
  // something else, because the chart was renamed and the intro was not.
  it("names the three lines the same way in the intro and on the chart", () => {
    render(<Page7 />);
    const intro = screen.getByText(/is what counting actually gets you/).closest("p")!;
    expect(intro.textContent).toMatch(/The vote returns the answer/);
    expect(intro.textContent).toMatch(/At least one chain is right/);
    expect(intro.textContent).toMatch(/One greedy chain/);
    expect(intro.textContent).not.toMatch(/In the pile/);
  });

  // "Greedy" is load-bearing here and first explained on page 10. The fix is to tie the
  // word to the definition this page already gives, not to import page 10's mechanism,
  // which docs/page_7_refactor.md:225-234 forbids at this altitude.
  it("ties the word greedy to the definition it already gives", () => {
    render(<Page7 />);
    const intro = screen.getByText(/is what counting actually gets you/).closest("p")!;
    // Greedy is the secondary name now: the reader is told what the setting IS before
    // being told what it is called.
    expect(intro.textContent).toMatch(
      /sampling is off, which is pure chain-of-thought, also known as greedy decoding/,
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
    const readout = screen.getByText(/How many .*answers those/).textContent ?? "";
    expect(readout.trimEnd()).toMatch(/averaged per problem\.$/);
  });

  // Load-bearing on this page and first explained on page 10, so it gets an
  // operational gloss here and no mechanism: docs/page_7_refactor.md:225-234 keeps
  // tokens and probability distributions off this page.
  it("glosses temperature without importing page 10's mechanism", () => {
    render(<Page7 />);
    const intro = screen.getByText(/Here is one box/).textContent ?? "";
    expect(intro).toMatch(/which is what temperature does/);
    expect(intro).toMatch(/at zero every chain comes back identical/);
    expect(intro).not.toMatch(/likel|distribution|logit/i);
  });

  // The +12 is voting AND sampling. The decomposition is in the margin; the box has to
  // point at it, or a reader who stops there credits all of it to counting.
  it("does not let the headline box own sampling's contribution", () => {
    render(<Page7 />);
    const callout = screen.getByText(/decoded greedily/i).closest("div")!;
    expect(callout.textContent).toMatch(/sampling rather than counting, and the margin says how much/);
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
  // Both places that describe the sweep have to carry the tie, or the readout claims a
  // falloff the data does not show and the caveat claims a rule that does not decide.
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
    expect(body).toMatch(/the vote comes out the same\s+at T = /);
    // "voted exactly as well" lived in the limitations block under section 5,
    // which was cut on 2026-08-10. The fact it carried is not lost: it is the
    // same tie, stated here as a finding about the sweep rather than as a
    // confession about the setting. What must not come back is a falloff claim
    // the run does not support, which the assertion above still guards.
    expect(body).not.toMatch(/does not say/i);
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

  it("labels the diversity readout as a count on its own smaller item set", () => {
    render(<Page7 />);
    expect(screen.getByText(/count of answers, not an\s+accuracy/i)).toBeInTheDocument();
  });

  // There is no provenance plate. The instrument used to open the page as a mono
  // specimen label above step 1, apparatus before idea. The download carries the
  // run now, and the two facts a reader needs from it are on the figures.
  it("names the model and the benchmark on the figures that use them", () => {
    render(<Page7 />);
    expect(screen.getByRole("link", { name: /Download the notebook/i })).toBeInTheDocument();
    const text = document.body.textContent ?? "";
    // figure 1's specimen card and figure 2's heading, both visible copy.
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
  it("lets the reader set how many chains the vote sees", () => {
    render(<Page7 />);
    const dial = screen.getByRole("slider", { name: /chains the vote may see/i });
    expect(dial).toHaveAttribute("min", "0");
    expect(dial).toHaveAttribute("max", String(PAGE7.figure2.hot.points.length - 1));
    // opens on the finished result the prose above the chart quotes
    expect(dial).toHaveValue(String(PAGE7.figure2.hot.points.length - 1));
  });

  it("reads out only measured points of the run's own N axis", () => {
    render(<Page7 />);
    const dial = screen.getByRole("slider", { name: /chains the vote may see/i });
    const live = document.querySelector("[aria-live='polite']")!;
    for (const [i, p] of PAGE7.figure2.hot.points.entries()) {
      fireEvent.change(dial, { target: { value: String(i) } });
      const text = live.textContent ?? "";
      expect(text).toMatch(new RegExp(`${Math.round(p.accuracy * 100)}%`));
      expect(text).toMatch(new RegExp(`${Math.round(p.coverage * 100)}%`));
    }
  });

  // The question F64 says the reader could not ask. At N = 2 the tie rule puts the
  // vote BELOW one sampled chain, and the readout has to say so rather than
  // describing every position as a gain.
  it("owns the positions where the vote is behind one chain", () => {
    render(<Page7 />);
    const pts = PAGE7.figure2.hot.points;
    const dial = screen.getByRole("slider", { name: /chains the vote may see/i });
    const live = document.querySelector("[aria-live='polite']")!;
    const behind = pts.findIndex((p, i) => i > 0 && p.accuracy < pts[0].accuracy);
    expect(behind).toBeGreaterThan(0);
    fireEvent.change(dial, { target: { value: String(behind) } });
    expect(live.textContent).toMatch(/below/i);
    const ahead = pts.findIndex((p, i) => i > 0 && p.accuracy > pts[0].accuracy);
    fireEvent.change(dial, { target: { value: String(ahead) } });
    expect(live.textContent).toMatch(/above/i);
  });
});
