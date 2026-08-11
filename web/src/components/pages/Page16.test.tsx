import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  ADAPTIVE_NULL,
  BIGGER,
  CROSSING,
  FORCED,
  LADDER,
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

// Anchored: an unanchored /1 of 12/ also matches "11 of 12" and "12 of 12".
const q1 = () => screen.getByRole("group", { name: /^1 of 12/ });
const optionsIn = (fieldset: HTMLElement) => within(fieldset).getAllByRole("radio");

describe("Page 16 (wrap-up) component", () => {
  it("tags itself Act 3 and closes the deck", () => {
    render(<Page16 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wrap-Up");
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    // Last page: PageNav offers no next link and says so.
    expect(screen.queryByRole("link", { name: /^Page 17 →/ })).toBeNull();
    expect(screen.getByText("The End")).toBeInTheDocument();
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

  it("asks twelve questions, each naming the page it came from", () => {
    render(<Page16 />);
    expect(screen.getAllByRole("group", { name: /of 12/ })).toHaveLength(12);
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
    const keyIndex = first.options.findIndex((o) => o.correct);
    fireEvent.click(optionsIn(q1())[keyIndex]);
    expect(within(q1()).getByText(/^Right\./)).toBeInTheDocument();
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
  });

  it("marks a wrong answer wrong, and still shows which one was right", () => {
    render(<Page16 />);
    const first = QUIZ[0];
    const wrongIndex = first.options.findIndex((o) => !o.correct);
    fireEvent.click(optionsIn(q1())[wrongIndex]);
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
    // The explanation is not a punishment: it appears whichever option was picked.
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
    expect(within(q1()).getByText("correct")).toBeInTheDocument();
    expect(within(q1()).getByText("your answer")).toBeInTheDocument();
  });

  it("does not let a wrong answer be taken back and re-picked", () => {
    render(<Page16 />);
    const first = QUIZ[0];
    const wrongIndex = first.options.findIndex((o) => !o.correct);
    const keyIndex = first.options.findIndex((o) => o.correct);
    fireEvent.click(optionsIn(q1())[wrongIndex]);
    for (const r of optionsIn(q1())) expect(r).toBeDisabled();
    // Clicking the key afterwards must not turn the verdict green: the point of
    // a concept check is finding out what you knew, not what you can converge on.
    fireEvent.click(optionsIn(q1())[keyIndex]);
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
  });

  it("keeps a running tally, and offers a way to start over", () => {
    render(<Page16 />);
    expect(screen.getByText(/right of 0 answered, 12 in all/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start over/i })).toBeNull();

    const keyIndex = QUIZ[0].options.findIndex((o) => o.correct);
    fireEvent.click(optionsIn(q1())[keyIndex]);
    expect(screen.getByText(/right of 1 answered, 12 in all/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByText(/right of 0 answered, 12 in all/)).toBeInTheDocument();
    for (const r of optionsIn(q1())) expect(r).not.toBeDisabled();
  });

  it("scores the whole set once every question is answered", () => {
    render(<Page16 />);
    for (const [i, q] of QUIZ.entries()) {
      const group = screen.getByRole("group", { name: new RegExp(`^${i + 1} of 12`) });
      fireEvent.click(optionsIn(group)[q.options.findIndex((o) => o.correct)]);
    }
    expect(screen.getByText(/Every one\./)).toBeInTheDocument();
    expect(screen.getByText(/12 of 12\./)).toBeInTheDocument();
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

  it("ends on what the deck did not settle, not on a summary", () => {
    render(<Page16 />);
    expect(screen.getByText(/What this deck did not settle/i)).toBeInTheDocument();
    // Both open items, and the second is the question page 15 hands forward.
    expect(screen.getByText(/every number is discounted/i)).toBeInTheDocument();
    // The caveat is sized and sourced here now. It used to state the claim and
    // point at page 15 for the evidence, which put a whole-deck measurement
    // caveat inside a page about the mechanisms by which reasoning breaks.
    const discounted = screen.getByText(/every number is discounted/i).closest("div")!;
    expect(discounted.textContent).toMatch(/published text is what the next model trains on/);
    expect(discounted.textContent).toMatch(/7 to 30 points below/);
    expect(discounted.textContent).toMatch(/fell from 40% to 1%/);
    expect(discounted.textContent).not.toMatch(/Page 15 sizes it/);
    expect(
      screen.getByRole("link", { name: /Balachandran et al\. 2025/i }).getAttribute("href"),
    ).toBe("https://arxiv.org/abs/2504.00294");
    expect(screen.getByText(/and the chain may not be the reason/i)).toBeInTheDocument();
    expect(
      screen.getByText(/nobody has yet shown is the reason for the answer/i),
    ).toBeInTheDocument();
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
