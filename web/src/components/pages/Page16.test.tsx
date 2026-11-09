import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  ADAPTIVE_NULL,
  FORCED,
  LADDER,
  NOTEBOOKS,
  OTHER_AXIS,
  QUIZ,
  WRITER,
} from "@/lib/page16";
import { Page16 } from "./Page16";

/**
 * Page 16's test file. The page renders no simulation of its own, so what is
 * worth testing is not arithmetic, it is the two things a wrap-up page can get
 * wrong in ways nothing else would catch.
 *
 * FIRST, THE LADDER MUST NOT FLATTER THE DECK. Its whole job is to show the
 * steps getting smaller and then not arriving: the coverage line has to stay
 * above the best technique, and the bigger model's rule has to stay level with
 * or above everything answer-time bought. Those are the two comparisons a
 * cheerful edit would quietly soften, so they are asserted against the data
 * rather than against the copy.
 *
 * SECOND, THE QUIZ MUST NOT GIVE ITSELF AWAY. Before a question is answered
 * nothing on screen may distinguish the right option from the other three, and
 * after it is answered the reader may not go back and re-pick until the tick
 * appears. Both are easy to break with a styling change and neither shows up in
 * a screenshot, so they are pinned here.
 */

// Anchored: an unanchored /1 of 10/ also matches "10 of 10".
const q1 = () => screen.getByRole("group", { name: /^1 of 10/ });
const optionsIn = (fieldset: HTMLElement) => within(fieldset).getAllByRole("radio");

/**
 * The radio for one authored option, found by its TEXT and never by its
 * position. Quiz.tsx re-scrambles the option order on every mount, so an index
 * into `q.options` says nothing about which radio is where on screen. A test
 * that clicked `radios[keyIndex]` would pass or fail by luck.
 */
const radioFor = (fieldset: HTMLElement, text: string): HTMLElement => {
  const label = optionsIn(fieldset)
    .map((r) => r.closest("label")!)
    .find((l) => l.textContent?.includes(text));
  if (!label) throw new Error(`no option reading "${text.slice(0, 40)}" in this question`);
  return label.querySelector("input")!;
};
const keyOf = (q: (typeof QUIZ)[number]) => q.options.find((o) => o.correct)!.text;
const distractorOf = (q: (typeof QUIZ)[number]) => q.options.find((o) => !o.correct)!.text;

describe("Page 16 (wrap-up) component", () => {
  it("tags itself Act 3 and closes the deck", () => {
    render(<Page16 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wrap-Up");
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    // The story's last page: the next page is the glossary appendix, page 17.
    expect(screen.getByRole("link", { name: "Page 17 →" })).toHaveAttribute("href", "/p/17");
  });

  // ---- section 1: the ladder ----

  it("draws every lever on one axis, and says which page measured each", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored on the same/i });
    for (const r of LADDER) {
      expect(fig.getAttribute("aria-label")).toContain(r.label);
    }
  });

  it("keeps the coverage ceiling above the best technique, in the label a reader hears", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    // The chart's one argument: the last step does not happen. If the ceiling
    // ever stops leading, the page's prose is wrong and this must fail.
    const best = Math.max(
      ...LADDER.filter((r) => !r.ceiling && r.band !== "elsewhere").map((r) => r.accuracy),
    );
    const ceiling = LADDER.find((r) => r.ceiling)!;
    expect(ceiling.accuracy).toBeGreaterThan(best);
    expect(fig.getAttribute("aria-label")).toMatch(/generated and not picked/i);
  });

  it("draws no band headings, and speaks none either", () => {
    // Headings over the groups turned the chart into a table of contents. The
    // grouping still orders the rows; nothing renders or announces its titles,
    // so sighted and screen-reader readers get the same chart.
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    for (const title of [
      "what writing the reasoning is worth",
      "what sampling and selecting add to it",
      "what the same money buys elsewhere",
    ]) {
      expect(fig.getAttribute("aria-label")).not.toContain(title);
      expect(fig.textContent).not.toContain(title.toUpperCase());
    }
  });

  it("puts each readout on its own bar rather than in a side column", () => {
    // The deck's bar-chart grammar: a row is read left to right in one move.
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    expect(fig.textContent).not.toMatch(/\bSCORE\b|\bFROM\b/);
    // Every readout sits to the right of the bar end it belongs to.
    const texts = Array.from(fig.querySelectorAll("text"));
    for (const r of LADDER) {
      const value = texts.find(
        (el) => el.textContent === `${Math.round(r.accuracy * 100)}%` && el.getAttribute("x"),
      );
      expect(value, r.label).toBeTruthy();
    }
  });

  it("speaks page 9's baseline, so its rung is not heard as a bare 58%", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    for (const r of LADDER.filter((x) => x.baseline !== undefined)) {
      expect(fig.getAttribute("aria-label")).toContain(
        `up from ${Math.round(r.baseline! * 100)}% on that run's own vote`,
      );
    }
  });

  it("keeps the bill out of the chart and in the prose, where it has units", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    // A column with four numbers and six blanks reads as missing data. The one
    // comparison that turns on cost is made in a sentence instead.
    expect(fig.getAttribute("aria-label")).not.toMatch(/greedy chains/);
    expect(fig.textContent).not.toMatch(/\bBILL\b/i);
  });

  it("shows forcing more thinking as the null it measured", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    const forced = LADDER.find((r) => r.label.includes("forced to keep thinking"))!;
    expect(fig.getAttribute("aria-label")).toContain(forced.label);
    // The chart may not flatter it: the rung sits at or below the chain above.
    expect(forced.accuracy).toBeLessThanOrEqual(FORCED.before);
  });


  it("captions the chart with its shape, not with a restatement of every rung", () => {
    render(<Page16 />);
    // Four paragraphs used to walk the rungs the chart already draws. What a
    // reader cannot get from the picture is the shape, so that is all the
    // caption says, and the numbers are spent once in the takeaways.
    const caption = screen.getByText(/Read it top to bottom as steps that keep getting smaller/i);
    expect(caption.textContent).toMatch(/largest single move on the chart/i);
    expect(caption.textContent).toMatch(/the only step that goes backwards/i);
    // The clause about a 128-token chain went with the rung it described.
    expect(caption.textContent).not.toMatch(/cut off at/i);
  });

  it("puts thinking longer on the chart", () => {
    render(<Page16 />);
    const fig = screen.getByRole("img", { name: /What each lever scored/i });
    for (const r of LADDER.filter((x) => x.page === 6)) {
      expect(fig.getAttribute("aria-label")).toContain(r.label);
    }
  });

  it("keeps the distilled result off the axis, and says why it cannot be one", () => {
    render(<Page16 />);
    // The conclusions carry no figures, so what has to survive is the REASON the
    // biggest move in the deck is not a bar: a different test, plus the deck's own
    // admission that it cannot separate the easier test from the training.
    const six = screen.getByText(/not on this axis/i).closest("section")!;
    expect(six.textContent).toMatch(/not a bar/i);
    expect(six.textContent).toMatch(/not the same test/i);
    expect(six.textContent).toMatch(/every difficulty level/i);
    expect(six.textContent).toMatch(/cannot tell you how it splits/i);
  });

  it("lays the wrap-up out top to bottom, never two columns of prose", () => {
    // House rule since page 1: figures may sit side by side, running prose may
    // not. A reader should never have to track back up and left mid-thought.
    const { container } = render(<Page16 />);
    const twoCol = Array.from(container.querySelectorAll("*")).filter((el) =>
      /(^|\s)(sm:|md:|lg:|xl:)?grid-cols-2(\s|$)/.test(el.className.toString()),
    );
    expect(twoCol.map((el) => el.className.toString())).toEqual([]);
  });

  // ---- section 2: the concept check ----

  /**
   * The chart says where every number came from, in a stacked list of the
   * notebooks that produced them, plus the one-writer disclaimer. Added
   * 2026-08-10 with the removal of the other-model row, which is what made the
   * disclaimer true: every remaining rung is the same model's chains.
   */
  it("offers every rung's run on the top line, where pages 5 to 10 put theirs", () => {
    render(<Page16 />);
    expect(NOTEBOOKS.length).toBeGreaterThan(0);
    for (const n of NOTEBOOKS) {
      const link = screen.getByRole("link", { name: new RegExp(`Page ${n.page}: ${n.title}`, "i") });
      expect(link.getAttribute("href")).toBe(n.href);
      // `download` and a stated size are the convention on every other run page.
      expect(link).toHaveAttribute("download");
      expect(link.getAttribute("aria-label")).toContain(n.size);
    }
    // Page 5's link is its author's two notebooks in one zip, the same file page 5 offers.
    const p5 = screen.getByRole("link", { name: /^Page 5:/ });
    expect(p5).toHaveAttribute("href", "/notebooks/page-05-chain-of-thought.zip");
    expect(p5.getAttribute("aria-label")).toMatch(/Download the notebooks, zip, 62 KB$/);
    // Derived from the ladder, so a rung can never quietly outlive its source.
    const pages = [...new Set(LADDER.map((r) => r.page))].sort((a, b) => a - b);
    expect(NOTEBOOKS.map((n) => n.page)).toEqual(pages);
    // They belong above the chart, not between the chart and the conclusions.
    const first = screen.getByRole("link", { name: new RegExp(`Page ${NOTEBOOKS[0].page}:`, "i") });
    const chart = screen.getByRole("img", { name: /What each lever scored/i });
    expect(first.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("says one model wrote every chain on the chart, and can still say it", () => {
    render(<Page16 />);
    expect(screen.getByText(new RegExp(`Every chain above was written by ${WRITER}`))).toBeInTheDocument();
    // The claim is only true while no rung belongs to another writer.
    expect(LADDER.some((r) => r.band === "elsewhere")).toBe(false);
    // A judge scores chains, it does not write them, and the page says so.
    expect(screen.getByText(/it scores chains, it does not write them/i)).toBeInTheDocument();
  });

  it("asks ten questions, each naming the page it came from", () => {
    render(<Page16 />);
    expect(screen.getAllByRole("group", { name: /of 10/ })).toHaveLength(10);
    for (const q of QUIZ) {
      expect(screen.getAllByText(new RegExp(`page ${q.page} · ${q.concept}`)).length).toBeGreaterThan(0);
    }
  });

  it("gives nothing away before an answer is picked", () => {
    render(<Page16 />);
    // No verdict text anywhere, and every option still selectable. A reader who
    // can spot the key from the markup is not being tested on anything.
    expect(screen.queryByText(/^Right\./)).toBeNull();
    expect(screen.queryByText(/^Not quite\./)).toBeNull();
    expect(screen.queryAllByText("correct")).toHaveLength(0);
    for (const r of optionsIn(q1())) expect(r).not.toBeDisabled();
  });

  it("marks a right answer right, and says why", () => {
    render(<Page16 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), keyOf(first)));
    expect(within(q1()).getByText(/^Right\./)).toBeInTheDocument();
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
  });

  it("marks a wrong answer wrong, and still shows which one was right", () => {
    render(<Page16 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), distractorOf(first)));
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
    // The explanation is not a punishment: it appears whichever option was picked.
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
    expect(within(q1()).getByText("correct")).toBeInTheDocument();
    expect(within(q1()).getByText("your answer")).toBeInTheDocument();
  });

  it("does not let a wrong answer be taken back and re-picked", () => {
    render(<Page16 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), distractorOf(first)));
    for (const r of optionsIn(q1())) expect(r).toBeDisabled();
    // Clicking the key afterwards must not turn the verdict green: the point of
    // a concept check is finding out what you knew, not what you can converge on.
    fireEvent.click(radioFor(q1(), keyOf(first)));
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
  });

  it("keeps a running tally, and offers a way to start over", () => {
    render(<Page16 />);
    expect(screen.getByText(/right of 0 answered, 10 in all/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start over/i })).toBeNull();

    fireEvent.click(radioFor(q1(), keyOf(QUIZ[0])));
    expect(screen.getByText(/right of 1 answered, 10 in all/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByText(/right of 0 answered, 10 in all/)).toBeInTheDocument();
    for (const r of optionsIn(q1())) expect(r).not.toBeDisabled();
  });

  it("scores the whole set once every question is answered", () => {
    render(<Page16 />);
    for (const [i, q] of QUIZ.entries()) {
      const group = screen.getByRole("group", { name: new RegExp(`^${i + 1} of 10`) });
      fireEvent.click(radioFor(group, keyOf(q)));
    }
    expect(screen.getByText(/Every one\./)).toBeInTheDocument();
    expect(screen.getByText(/10 of 10\./)).toBeInTheDocument();
  });

  // ---- section 3: the honest close ----

  // ---- section 1b: the takeaways ----

  it("carries six numbered takeaways, read as a set", () => {
    render(<Page16 />);
    expect(screen.getByText(/Conclusions/i)).toBeInTheDocument();
    for (let n = 1; n <= 6; n++) {
      expect(screen.getByText(`${n}.`)).toBeInTheDocument();
    }
  });

  /**
   * The conclusions carry no figures at all, on purpose. The ladder directly
   * above is where the numbers live, priced and sourced off the modules that
   * measured them; restating them here made a reader decode the same table twice
   * at the exact point the deck should be handing over an idea. This guard is on
   * the whole section rather than on any one takeaway, because the failure mode
   * is a percentage creeping back in during a later tightening pass.
   */
  it("states the conclusions in words, with no figures and no model names", () => {
    render(<Page16 />);
    const heading = screen.getByText(/1b\. Conclusions/i);
    const section = heading.closest("div")!;
    const bodies = Array.from(section.querySelectorAll("section")).map((el) => el.textContent ?? "");
    expect(bodies).toHaveLength(6);
    for (const text of bodies) {
      // The leading "N." of each numbered heading is the only digit allowed.
      const body = text.replace(/^\s*\d+\./, "");
      expect(body).not.toMatch(/\d/);
      // No model names either: a reader should not need to know what a Qwen is.
      expect(body).not.toMatch(/Qwen|R1|DeepSeek|Distill|MATH-500/i);
    }
  });

  it("says reasoning wins, and that being made to do more of it does not", () => {
    render(<Page16 />);
    const one = screen.getByText(/Letting the model reason wins/i).closest("section")!;
    // The counterweight must travel with it, or the takeaway reads as "more is
    // better". It is stated in words now rather than in a token multiple, so the
    // guard is on the claim: forcing costs more and does not pay.
    expect(one.textContent).toMatch(/costs a great deal more/i);
    expect(one.textContent).toMatch(/as many answers wrong as it turns right/i);
    expect(one.textContent).toMatch(/not worth forcing/i);
  });

  it("names the judge as the bottleneck and prices the fix", () => {
    render(<Page16 />);
    const three = screen.getByText(/the judge is the bottleneck/i).closest("section")!;
    expect(three.textContent).toMatch(/trained to score/);
    // The cost has to be in the same breath, or "get a better judge" reads free.
    // Priced in words now, but it must still say that matching a bigger model this
    // way costs more than simply using the bigger model.
    expect(three.textContent).toMatch(/costs many times more compute/i);
    expect(three.textContent).toMatch(/simply using the bigger model/i);
  });

  it("offers adaptive compute as a direction and prints its own null beside it", () => {
    render(<Page16 />);
    const four = screen.getByText(/Adaptive compute is where that points/i).closest("section")!;
    expect(four.textContent).toMatch(/Spend more on the hard questions/i);
    // Proposing it without page 15's oracle result would be selling a technique
    // this deck measured and could not make work.
    expect(ADAPTIVE_NULL.beatsResampling).toBe(false);
    expect(four.textContent).toMatch(/no more per unit of compute than plain resampling/i);
  });

  it("keeps the pay-for-every-node lesson, and says why search has no bar", () => {
    render(<Page16 />);
    const five = screen.getByText(/you pay for every node you look at/i).closest("section")!;
    expect(five.textContent).toMatch(/before you can judge it/i);
    expect(five.textContent).toMatch(/never ran it/i);
    expect(five.textContent).toMatch(/second, larger model in memory/i);
    // Search has no rung, and must not acquire one without a run behind it.
    expect(LADDER.some((r) => r.page === 10)).toBe(false);
  });

  /**
   * Section 3 ("What this deck did not settle") was cut on 2026-08-10 by
   * request. It carried the contamination discount and page 15's question about
   * whether the chain is the real reason.
   *
   * What this now guards is the one thing that outlived it: the closing sentence
   * still ends the deck on the open question rather than on a summary, and it is
   * the only place left on this page that says the chain has not been shown to
   * be the reason for the answer. If that sentence goes too, the page ends on a
   * tidy recap and the deck stops admitting its own limit, so this test fails
   * rather than letting that happen quietly.
   */
  it("still ends on the open question rather than on a summary", () => {
    render(<Page16 />);
    expect(screen.queryByText(/What this deck did not settle/i)).toBeNull();
    expect(
      screen.getByText(/nobody has yet shown is the reason for the answer/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/where the field is, and where you now are/i)).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced across the deck: visible copy uses commas,
    // colons or semicolons, and ranges are spelled out ("7 to 30 points").
    // Covers aria-labels and chart titles, which screen readers speak.
    const { container } = render(<Page16 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });
});
