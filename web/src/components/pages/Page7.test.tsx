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
// Section 3 reads the temperature sweep: a line per temperature, and T = 0 is the greedy chain.
const SWEEP = PAGE7.sweep;
const BEST_LINE = SWEEP.curves[SWEEP.best_temperature.toFixed(1)];
const GREEDY_ACC = SWEEP.curves["0.0"][0].accuracy;

describe("Page 7 (frequency voting) component", () => {
  /** Figure 2's N control is a rule on the chart, moved here with its own keys. */
  const nControl = () => screen.getByRole("slider", { name: /# of sampled chains/ });
  const setVoters = (i: number) => {
    fireEvent.keyDown(nControl(), { key: "Home" });
    for (let k = 0; k < i; k++) fireEvent.keyDown(nControl(), { key: "ArrowRight" });
  };
  // The guard on the +12 (some of it is sampling, not counting) is carried by the
  // figure now. The vote line starts at ONE sampled chain, which already sits above
  // the flat greedy line before any vote is taken, and the readout there says so.
  it("shows in figure 2 that sampling alone is part of the gain", () => {
    render(<Page7 />);
    const one = BEST_LINE[0];
    expect(one.n).toBe(1);
    expect(one.accuracy).toBeGreaterThan(GREEDY_ACC);
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
    const card = screen.getByRole("region", { name: /One problem, 16 chains, tallied/ });
    expect(
      within(card).getByText(new RegExp(`${second.votes} of ${PAGE7.figure1.n_chains} chains`)),
    ).toBeInTheDocument();
  });

  // Since 2026-11-05 the chains are folded until a row is clicked, and clicking the
  // open row folds them again (author: section 2 down to one figure, the tally).
  it("folds the chains until a row is clicked, and again when the open row is clicked", () => {
    render(<Page7 />);
    expect(screen.queryByTestId("chain-reader")).toBeNull();
    tallyRows().forEach((r) => expect(r).toHaveAttribute("aria-expanded", "false"));
    fireEvent.click(tallyRows()[1]);
    expect(screen.getByTestId("chain-reader")).toBeInTheDocument();
    expect(tallyRows()[1]).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(tallyRows()[1]);
    expect(screen.queryByTestId("chain-reader")).toBeNull();
    expect(tallyRows()[1]).toHaveAttribute("aria-expanded", "false");
  });

  // The vote coming out wrong was a third choice until the author cut it (2026-10-11).
  it("offers two problems: the vote right, and the vote tied", () => {
    render(<Page7 />);
    const picker = screen.getByRole("radiogroup", { name: /Pick a problem/i });
    const choices = within(picker).getAllByRole("radio");
    expect(choices.map((b) => b.getAttribute("aria-label"))).toEqual([
      "the vote is right",
      "the vote ties",
    ]);
    expect(picker.textContent).not.toMatch(/wrong/);
    expect(
      screen.getByRole("region", { name: /One problem, \d+ chains, tallied/ }).textContent,
    ).not.toMatch(/the vote is wrong/);
    expect(choices[0]).toBeChecked();
    for (const [i, { problem }] of PAGE7.figure1.showcase.entries()) {
      fireEvent.click(choices[i]);
      expect(tallyRows()).toHaveLength(problem.ranked.length);
      // A problem opens folded, whatever was open on the last one.
      expect(screen.queryByTestId("chain-reader")).toBeNull();
      // Its correct answer is among the rows, even where the vote did not return it.
      const right = problem.ranked.findIndex((r) => r.correct);
      expect(right).toBeGreaterThanOrEqual(0);
      fireEvent.click(tallyRows()[right]);
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
      // A chain that hit the cap wrote no answer, so it is on no row; the page says so.
      const answered = problem.chains.filter((c) => c.vote_key !== null);
      expect([...seen].sort()).toEqual(answered.map((c) => String(c.sample_index)).sort());
      const silent = problem.chains.length - answered.length;
      if (silent > 0) {
        expect(screen.getByTestId("no-answer").textContent).toMatch(
          new RegExp(`^${silent} chains? .*no answer, so (it casts|they cast) no vote$`),
        );
      } else {
        expect(screen.queryByTestId("no-answer")).toBeNull();
      }
    }
  });

  // Chains run to 272 lines. The reader sees the opening and the ending, which is
  // where the chain commits to its answer, and opens the middle on request.
  it("folds a long chain to its opening and its ending", () => {
    render(<Page7 />);
    const chain = chainsFor(PAGE7.figure1.specimen, PAGE7.figure1.specimen.ranked[0].answer)[0];
    const { head, middle, tail } = foldTrace(tidyMath(chain.trace));
    expect(middle.length).toBeGreaterThan(0);
    fireEvent.click(tallyRows()[0]);
    const trace =() => screen.getByTestId("chain-trace").textContent ?? "";
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
    fireEvent.click(tallyRows()[0]);
    const next =screen.getByRole("button", { name: "Next chain" });
    const pageTurn = vi.fn();
    window.addEventListener("keydown", pageTurn);
    fireEvent.keyDown(next, { key: "ArrowRight" });
    expect(chainPosition()).toMatch(/^chain 2 of/);
    fireEvent.keyDown(next, { key: "ArrowLeft" });
    expect(chainPosition()).toMatch(/^chain 1 of/);
    expect(pageTurn).not.toHaveBeenCalled();
    window.removeEventListener("keydown", pageTurn);
  });

  // Section 2 is one figure, the tally (author, 2026-11-05): the temperature heat map
  // and the shape stat are cut, since section 3 says the same in aggregate. The sweep
  // they drew from still feeds section 3.
  it("keeps section 2 to the tally: no heat map and no shape stat", () => {
    render(<Page7 />);
    expect(screen.queryByRole("region", { name: /Chains right and the vote, at every temperature/ })).toBeNull();
    expect(screen.queryByTestId("heatmap-problem")).toBeNull();
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/distinct answers\. Agreement concentrates/);
    expect(body).not.toMatch(/said exactly once/);
    expect(body).not.toMatch(/got there by different mistakes/);
    SWEEP.temperatures.forEach((t, j) => expect(t).toBeCloseTo(j / 10, 9));
    expect(SWEEP.n_chains).toBe(16);
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
  // Section 3 draws every temperature of the sweep, the best highlighted to start; picking
  // another highlights it, and the readout follows.
  it("draws one band for every temperature and a line for the one picked", () => {
    render(<Page7 />);
    const widget = screen.getByRole("region", { name: /Accuracy against the number/ });
    const picker = within(widget).getByRole("radiogroup", { name: "Temperature" });
    const radios = within(picker).getAllByRole("radio");
    expect(radios).toHaveLength(SWEEP.temperatures.length);
    const best = within(picker).getByRole("radio", { name: /, the best$/ });
    expect(best).toBeChecked();
    expect(best.getAttribute("aria-label")).toBe(`T = ${SWEEP.best_temperature.toFixed(1)}, the best`);
    // One band behind one picked line, not a faint line per temperature.
    expect(within(widget).getByTestId("temperature-band")).toBeInTheDocument();
    expect(widget.querySelectorAll("[data-testid^='sweep-line-']")).toHaveLength(1);
    expect(within(widget).getByTestId(`sweep-line-${SWEEP.best_temperature.toFixed(1)}`)).toBeInTheDocument();
    const live = document.querySelector("p[aria-live='polite']")!;
    expect(live.textContent).toContain(`at T = ${SWEEP.best_temperature.toFixed(1)}`);
    fireEvent.click(within(picker).getByRole("radio", { name: "T = 1.1" }));
    expect(within(widget).getByTestId("sweep-line-1.1")).toBeInTheDocument();
    const hot = SWEEP.curves["1.1"];
    expect(live.textContent).toContain("at T = 1.1");
    expect(live.textContent).toContain(`${Math.round(hot[hot.length - 1].accuracy * 100)}%`);
  });

  // T = 0 is a temperature like the others: its line is the greedy chain, so picking it
  // says there is nothing to vote on rather than calling the copies sampled chains.
  it("draws T = 0 too, as the greedy chain", () => {
    render(<Page7 />);
    const widget = screen.getByRole("region", { name: /Accuracy against the number/ });
    const picker = within(widget).getByRole("radiogroup", { name: "Temperature" });
    fireEvent.click(within(picker).getByRole("radio", { name: "T = 0" }));
    const live = document.querySelector("p[aria-live='polite']")!;
    expect(live.textContent).toMatch(/At T = 0 every chain is the same greedy chain/);
    expect(live.textContent).toContain(`${Math.round(GREEDY_ACC * 100)}%`);
    expect(live.textContent).toMatch(/nothing to vote on/);
    expect(live.textContent).not.toMatch(/sampled chains/);
    for (const p of SWEEP.curves["0.0"]) expect(p.accuracy).toBeCloseTo(GREEDY_ACC, 9);
  });

  // Section 3 opens on temperature, then the author's bridge turns to the vote against one
  // plain chain, tying "pure chain of thought" to the greedy line before the reader meets it.
  it("bridges from temperature to the vote against greedy decoding, on claims the sweep supports", () => {
    render(<Page7 />);
    const bridge = screen.getByTestId("sweep-bridge").textContent ?? "";
    const lbl = (t: number) => (t === 0 ? "0" : t.toFixed(1));
    const sampled = SWEEP.temperatures.filter((t) => t > 0);
    expect(bridge).toMatch(/^Raising the temperature gives more different answers, but more answers do not mean\s+better results\./);
    expect(bridge).toMatch(
      new RegExp(`each of the ${sampled.length} temperatures from ${lbl(sampled[0])} to\\s+${lbl(sampled[sampled.length - 1])}, in steps of 0\\.1`),
    );
    expect(bridge).toMatch(/greedy decoding, the dashed line/);
    // The best temperature, with every tie named rather than one winner picked.
    const byT = [...SWEEP.summary].sort((a, b) => a.temperature - b.temperature);
    const top = Math.max(...byT.map((d) => d.vote_accuracy));
    expect(bridge).toMatch(new RegExp(`the vote does best at T = ${lbl(SWEEP.best_temperature)}`));
    for (const d of byT.filter((d) => Math.abs(d.vote_accuracy - top) < 1e-9)) {
      expect(bridge).toContain(`T = ${lbl(d.temperature)}`);
    }
    // Every sampled temperature's vote at 16 chains beats one greedy chain, and the range
    // quoted is the range drawn. At two chains the ties pull some temperatures below it.
    const sixteen = sampled.map((t) => SWEEP.curves[t.toFixed(1)].at(-1)!);
    for (const p of sixteen) {
      expect(p.n).toBe(16);
      expect(p.accuracy).toBeGreaterThan(GREEDY_ACC);
    }
    const pc = (v: number) => `${Math.round(v * 100)}%`;
    const accs = sixteen.map((p) => p.accuracy);
    expect(bridge).toMatch(
      new RegExp(`the vote at 16 chains\\s+still beats one greedy chain: it solves between ${pc(Math.min(...accs))} and\\s+${pc(Math.max(...accs))}, against ${pc(GREEDY_ACC)}\\.`),
    );
    // "The only place majority voting does worse than greedy" is two chains: no vote of two
    // or more chains falls below greedy anywhere else. (One chain is not a vote.)
    const votesBelow = sampled.flatMap((t) =>
      SWEEP.curves[t.toFixed(1)].filter((p) => p.n >= 2 && p.accuracy < GREEDY_ACC),
    );
    expect(votesBelow.length).toBeGreaterThan(0);
    for (const p of votesBelow) expect(p.n).toBe(2);
    expect(bridge).toMatch(
      /Two chains are the exception, due\s+to tie votes\. That is the only place we found majority voting doing worse than greedy\s+decoding\.$/,
    );
    expect(document.body.textContent).not.toMatch(/likeliest|probability distribution/i);
  });

  // Prose trims: each of these was said twice.
  it("says each thing once around figure 2", () => {
    render(<Page7 />);
    const body = document.body.textContent ?? "";
    expect(screen.getAllByText(/Click a row to read the chains/i)).toHaveLength(1);
    expect(body).not.toMatch(/never the first two/);
    // Temperature is glossed once, in step 3's lead-in (moved from step 2 by the
    // author, 2026-11-05).
    expect(body.match(/It is a dial, written/g) ?? []).toHaveLength(1);
  });

  // Load-bearing on this page and first explained on page 10, so it gets an
  // operational gloss here and no mechanism: docs/page_7_refactor.md:225-234 keeps
  // tokens and probability distributions off this page.
  it("glosses temperature in section 3, not section 2, without importing page 10's mechanism", () => {
    render(<Page7 />);
    const s2 = screen.getByText(/Here are two problems/).textContent ?? "";
    expect(s2).not.toMatch(/temperature/i);
    expect(s2).toMatch(/with the same prompt every time/);
    const lead = screen.getByTestId("temperature-lead").textContent ?? "";
    const first = PAGE7.figure1.showcase[0].problem;
    expect(lead).toMatch(
      new RegExp(`the ${first.chains.length} chains on the first problem gave\\s+${first.distinct_answers} different answers`),
    );
    expect(lead).toMatch(/Temperature is\s+the hidden machinery behind this variation/);
    expect(lead).toMatch(/At T = 0,\s+every chain comes back identical, which is what is called\s+greedy decoding\./);
    const top = Math.max(...SWEEP.temperatures);
    expect(lead).toMatch(new RegExp(`increase the temperature gradually, to ${top === 0 ? "0" : top.toFixed(1)}\\.$`));
    expect(lead).not.toMatch(/likel|distribution|logit/i);
    // "even among chains that arrived at the same answer": every chain sharing an answer
    // on the first problem has its own text.
    const byAnswer = new Map<string, Set<string>>();
    for (const c of first.chains) {
      const set = byAnswer.get(c.extracted_answer) ?? new Set<string>();
      byAnswer.set(c.extracted_answer, set.add(c.trace));
    }
    for (const [answer, texts] of byAnswer) {
      expect(texts.size).toBe(first.chains.filter((c) => c.extracted_answer === answer).length);
    }
  });

  // The dip is explained where the reader meets it: labelled on the chart, and the
  // readout at two chains names the ties. The prose sentence under the widget was cut.
  it("explains the dip at N = 2 as the tie rule", () => {
    render(<Page7 />);
    const widget = screen.getByRole("region", { name: /Accuracy against the number/ });
    expect(widget.textContent).toMatch(/ties/);
    const two = BEST_LINE.findIndex((p) => p.n === 2);
    setVoters(two);
    const live = document.querySelector("p[aria-live='polite']")!;
    expect(live.textContent).toMatch(
      new RegExp(`${Math.round(BEST_LINE[two].tie_rate * 100)}% of these votes tie`),
    );
  });

  it("leaves the temperature figure without a caption", () => {
    render(<Page7 />);
    const fig = screen.getByRole("figure", { name: /Different answers among 16 chains/ });
    expect(fig.querySelector("figcaption")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Averaged over \d+/);
  });

  // Section 3's order (author, 2026-11-05): the temperature figure first, then the bridge,
  // then the line chart, with nothing under it (the greedy headline was cut). T = 0 is one
  // answer and a flat line, which the lead-in's greedy-decoding definition relies on.
  it("puts the temperature figure first, then the bridge and the line chart, and ends there", () => {
    render(<Page7 />);
    const fig = screen.getByRole("figure", { name: /Different answers among 16 chains/ });
    const bridge = screen.getByTestId("sweep-bridge");
    const chart = screen.getByRole("region", { name: /Accuracy against the number/ });
    const follows = (x: Element, y: Element) =>
      Boolean(x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(fig.closest("section")!.previousElementSibling?.textContent).toMatch(/Temperature[\s\S]*hidden machinery/);
    expect(follows(fig, bridge) && follows(bridge, chart)).toBe(true);
    expect(chart.nextElementSibling).toBeNull();
    expect(document.body.textContent).not.toMatch(/One greedy chain solves/);
    // One answer wherever the greedy chain wrote one; a greedy chain cut off at the cap has
    // none, so the mean sits a little under 1.
    const cold = SWEEP.summary.find((d) => d.temperature === 0)!;
    expect(cold.mean_distinct).toBeLessThanOrEqual(1);
    expect(cold.mean_distinct).toBeGreaterThan(0.9);
    for (const p of SWEEP.curves["0.0"]) expect(p.accuracy).toBeCloseTo(GREEDY_ACC, 9);
  });

  // Framed across the content column like section 4's tokens (author, 2026-11-05): one
  // column per temperature, left to right, each labelled with its count.
  it("draws the temperature sweep as a framed column per temperature", () => {
    render(<Page7 />);
    const fig = screen.getByRole("figure", { name: /Different answers among 16 chains/ });
    expect(fig.closest("section")!.className).toMatch(/border/);
    // Coloured by temperature, one colour each, and only the best one starred.
    const fills = [...fig.querySelectorAll<HTMLElement>("[data-testid='column-fill']")];
    expect(new Set(fills.map((f) => f.style.background)).size).toBe(SWEEP.temperatures.length);
    expect((fig.textContent!.match(/★/g) ?? []).length).toBe(1);
    const bars = within(fig).getAllByTestId("diversity-bar");
    const byT = [...SWEEP.summary].sort((a, b) => a.temperature - b.temperature);
    expect(bars).toHaveLength(byT.length);
    expect(byT[0].temperature).toBe(0);
    for (const [i, d] of byT.entries()) {
      expect(Number(bars[i].getAttribute("data-value"))).toBe(d.mean_distinct);
      expect(bars[i].getAttribute("aria-label")).toContain(`T = ${d.temperature === 0 ? "0" : d.temperature.toFixed(1)}`);
      expect(bars[i].textContent).toContain(d.mean_distinct.toFixed(1));
    }
  });

  // Section 4 is cost, majority voting against greedy decoding (author, 2026-11-05).
  // Section 4 draws real chains (author, 2026-11-05): every chain written for figure 1's
  // first problem, greedy first, each as long as its tokens.
  it("draws every chain written for the first problem, greedy first, at its own length", () => {
    render(<Page7 />);
    expect(screen.getByRole("heading", { name: "4. What majority voting costs" })).toBeInTheDocument();
    const frame = screen.getByRole("region", { name: "Every chain written for one problem" });
    const { problem, greedy } = PAGE7.figure1.showcase[0];
    const strips = within(frame).getAllByTestId("chain-strip");
    expect(strips).toHaveLength(1 + problem.chains.length);
    expect(Number(strips[0].getAttribute("data-tokens"))).toBe(greedy.own_tokens);
    problem.chains.forEach((c, i) =>
      expect(Number(strips[i + 1].getAttribute("data-tokens"))).toBe(c.own_tokens),
    );
    const total = problem.chains.reduce((s, c) => s + c.own_tokens, 0);
    expect(within(frame).getByTestId("chains-total").textContent).toBe(total.toLocaleString("en-US"));
    // every capped chain is marked, and only those
    expect((frame.textContent!.match(/hit the cap/g) ?? []).length).toBe(
      problem.chains.filter((c) => c.truncated).length + (greedy.truncated ? 1 : 0),
    );
    // Section 3 carries accuracy.
    expect(frame.textContent).not.toMatch(/%/);
    expect(document.body.textContent).not.toMatch(/fixed budget|Splitting is not what fails/);
  });

  // The wall-clock sentence was measured on the old run's problems at T = 0.3, so it is
  // off the page until a timing run exists for this one.
  it("quotes section 4's tokens from the sweep, and no wall-clock time", () => {
    render(<Page7 />);
    const top = SWEEP.curves[SWEEP.best_temperature.toFixed(1)].at(-1)!;
    const greedy = SWEEP.curves["0.0"][0];
    const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
    const summary = screen.getByTestId("cost-summary").textContent ?? "";
    expect(summary).toMatch(
      new RegExp(`^16 chains write ${fmt(top.mean_tokens)} tokens per problem, against\\s+${fmt(greedy.mean_tokens)} for one greedy chain, about\\s+${Math.round(top.mean_tokens / greedy.mean_tokens)} times as many`),
    );
    expect(summary).toContain(`from ${Math.round(GREEDY_ACC * 100)}% to ${Math.round(top.accuracy * 100)}%`);
    expect(summary).not.toMatch(/\btime\b|as long|GPU|minutes/i);
  });

  // The voter control's readout quotes the same thrown-away share at N = 16, which is
  // the agreement we want and not a duplicate claim, so this pins the handoff by its
  // own sentence rather than by the number being unique on the page.
  it("closes on the number page 8 opens on", () => {
    render(<Page7 />);
    const handoff = screen.getByText(/the vote discarded it/i);
    expect(handoff).toBeInTheDocument();
    expect(handoff.textContent).toContain(`${Math.round(PAGE7.handoff.thrown_away * 100)}%`);
    expect(handoff.textContent).toContain(`${Math.round(PAGE7.handoff.coverage * 100)}%`);
    expect(handoff.textContent).toContain(`${Math.round(PAGE7.handoff.plurality_accuracy * 100)}%`);
  });

  // There is no provenance plate. The instrument used to open the page as a mono
  // specimen label above step 1, apparatus before idea. The download carries the
  // run now, and the two facts a reader needs from it are on the figures.
  it("names the model and the benchmark on the figures that use them", () => {
    render(<Page7 />);
    expect(screen.getByRole("link", { name: /Download the frequency voting notebook \(ipynb/i })).toHaveAttribute(
      "href",
      "/notebooks/7_FrequencyVoting_InstructModels.ipynb",
    );
    const text = document.body.textContent ?? "";
    // figure 1's specimen card and figure 2's intro, both visible copy.
    expect(text).toContain(PAGE7.primary.label);
    expect(text).toContain("MATH-500");
    expect(text).not.toContain("reasoning-from-scratch");
  });

  it("keeps the retired provenance plate off the page", () => {
    render(<Page7 />);
    const text = document.body.textContent ?? "";
    expect(text).not.toContain("one measurement of ours");
    expect(text).not.toContain(PAGE7.run.notebook);
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

  // Step 1's classroom is the one figure allowed to say "illustrative": it is an
  // analogy, not a stand-in for the run, and it says so. Everywhere else the word
  // would mean a simulated number had come back.
  it("does not reintroduce the simulation the refactor removed", () => {
    render(<Page7 />);
    const classroom = screen.getByRole("region", { name: "Four ways to the same answer" });
    expect(classroom.textContent).toMatch(/This is an illustrative example/);
    classroom.remove();
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
    for (const [i, p] of BEST_LINE.entries()) {
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
    const pts = BEST_LINE;
    const greedy = GREEDY_ACC;
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
