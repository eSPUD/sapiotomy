import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  ADAPTIVE_NULL,
  BASE_CHART,
  GRPO_CHART,
  GRPO_SCOPE,
  INSTRUCT_CHART,
  NOTEBOOKS,
  OTHER_AXIS,
  QUIZ,
} from "@/lib/page16";
import { Page15 } from "./Page15";

/**
 * Page 16's test file. The page renders no simulation of its own, so what is
 * worth testing is not arithmetic, it is the two things a wrap-up page can get
 * wrong in ways nothing else would catch.
 *
 * FIRST, THE CHARTS MUST SAY WHAT THEY COVER. GRPO is a different model and
 * benchmark from the other two charts, and that has to stay on the figure.
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

describe("Page 15 (wrap-up) component", () => {
  it("tags itself Act 3 and closes the deck", () => {
    render(<Page15 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Wrap-Up");
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    // The story's last page: the next page is the glossary appendix, page 16.
    expect(screen.getByRole("link", { name: "16. Glossary →" })).toHaveAttribute("href", "/p/16");
  });

  // ---- section 1: the charts ----

  const CHARTS = [
    { name: /^Qwen2\.5-3B base model/, bars: BASE_CHART },
    { name: /^Qwen2\.5-3B-Instruct/, bars: INSTRUCT_CHART },
    { name: /^GRPO on Qwen2\.5-1\.5B-Instruct/, bars: GRPO_CHART },
  ];

  it("draws three charts, each bar with its label and readout", () => {
    render(<Page15 />);
    for (const { name, bars } of CHARTS) {
      const fig = screen.getByRole("img", { name });
      const texts = Array.from(fig.querySelectorAll("text")).map((t) => t.textContent);
      for (const b of bars) {
        expect(texts, b.label).toContain(b.label);
        expect(texts, b.label).toContain(`${Math.round(b.accuracy * 100)}%`);
        expect(fig.getAttribute("aria-label")).toContain(b.detail);
      }
    }
  });

  it("colours a bar by its category and names every category in the legend", () => {
    const { container } = render(<Page15 />);
    const fig = screen.getByRole("img", { name: /^GRPO on/ });
    expect(fig.querySelectorAll("rect.fill-crimson")).toHaveLength(GRPO_CHART.length);
    const instruct = screen.getByRole("img", { name: /^Qwen2\.5-3B-Instruct/ });
    expect(instruct.querySelectorAll("rect.fill-compute")).toHaveLength(4);
    expect(instruct.querySelectorAll("rect.fill-wrong-bright")).toHaveLength(1);
    expect(container.textContent).toContain("inference + training-time scaling");
  });

  it("says inside the GRPO figure that it covers only the 1.5B", () => {
    render(<Page15 />);
    const figure = screen.getByRole("img", { name: /^GRPO on/ }).closest("figure")!;
    expect(figure.textContent).toContain(GRPO_SCOPE);
  });

  it("flags thinking longer's different problems under the charts", () => {
    render(<Page15 />);
    expect(screen.getByText("*thinking longer")).toBeInTheDocument();
  });

  it("keeps the distilled result off the axis, and says why it cannot be one", () => {
    render(<Page15 />);
    // The conclusions carry no figures, so what has to survive is the REASON the
    // biggest move in the deck is not a bar: a different test, plus the deck's own
    // admission that it cannot separate those differences from the training.
    const six = screen.getByText(/training adds to what inference-time scaling buys/i).closest("section")!;
    expect(six.textContent).toMatch(/not a bar/i);
    expect(six.textContent).toMatch(/not our run/i);
    expect(six.textContent).toMatch(/published score/i);
    expect(six.textContent).toMatch(/cannot tell you how it splits/i);
  });

  it("lays the wrap-up out top to bottom, never two columns of prose", () => {
    // House rule since page 1: figures may sit side by side, running prose may
    // not. A reader should never have to track back up and left mid-thought.
    const { container } = render(<Page15 />);
    const twoCol = Array.from(container.querySelectorAll("*")).filter((el) =>
      /(^|\s)(sm:|md:|lg:|xl:)?grid-cols-2(\s|$)/.test(el.className.toString()),
    );
    expect(twoCol.map((el) => el.className.toString())).toEqual([]);
  });

  // ---- section 2: the concept check ----

  it("offers every bar's run on the top line, where pages 5 to 10 put theirs", () => {
    render(<Page15 />);
    expect(NOTEBOOKS.length).toBeGreaterThan(0);
    for (const n of NOTEBOOKS) {
      const link = screen.getByRole("link", { name: new RegExp(`Page ${n.page}: ${n.title}`, "i") });
      expect(link.getAttribute("href")).toBe(n.href);
      // `download` and a stated size are the convention on every other run page.
      expect(link).toHaveAttribute("download");
      expect(link.getAttribute("aria-label")).toContain(n.size);
    }
    // Page 5's two links are the first chart's two runs.
    const p5 = screen.getAllByRole("link", { name: /^Page 5:/ });
    expect(p5.map((a) => a.getAttribute("href"))).toEqual([
      "/notebooks/5_CoT_ZeroShot-vs-FewShot.ipynb",
      "/notebooks/5_CoT_BaseFewShot-vs-Instruct.ipynb",
    ]);
    // Derived from the charts, so a bar can never quietly outlive its source.
    const bars = [...BASE_CHART, ...INSTRUCT_CHART, ...GRPO_CHART];
    const pages = [...new Set(bars.map((b) => b.run))].sort((a, b) => a - b);
    expect([...new Set(NOTEBOOKS.map((n) => n.page))]).toEqual(pages);
    // They belong above the charts, not between the charts and the conclusions.
    const first = screen.getAllByRole("link", { name: new RegExp(`Page ${NOTEBOOKS[0].page}:`, "i") })[0];
    const chart = screen.getByRole("img", { name: /^Qwen2\.5-3B base model/ });
    expect(first.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("asks ten questions, each naming the page it came from", () => {
    render(<Page15 />);
    expect(screen.getAllByRole("group", { name: /of 10/ })).toHaveLength(10);
    for (const q of QUIZ) {
      expect(screen.getAllByText(new RegExp(`page ${q.page} · ${q.concept}`)).length).toBeGreaterThan(0);
    }
  });

  it("gives nothing away before an answer is picked", () => {
    render(<Page15 />);
    // No verdict text anywhere, and every option still selectable. A reader who
    // can spot the key from the markup is not being tested on anything.
    expect(screen.queryByText(/^Right\./)).toBeNull();
    expect(screen.queryByText(/^Not quite\./)).toBeNull();
    expect(screen.queryAllByText("correct")).toHaveLength(0);
    for (const r of optionsIn(q1())) expect(r).not.toBeDisabled();
  });

  it("marks a right answer right, and says why", () => {
    render(<Page15 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), keyOf(first)));
    expect(within(q1()).getByText(/^Right\./)).toBeInTheDocument();
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
  });

  it("marks a wrong answer wrong, and still shows which one was right", () => {
    render(<Page15 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), distractorOf(first)));
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
    // The explanation is not a punishment: it appears whichever option was picked.
    expect(within(q1()).getByText(first.why)).toBeInTheDocument();
    expect(within(q1()).getByText("correct")).toBeInTheDocument();
    expect(within(q1()).getByText("your answer")).toBeInTheDocument();
  });

  it("does not let a wrong answer be taken back and re-picked", () => {
    render(<Page15 />);
    const first = QUIZ[0];
    fireEvent.click(radioFor(q1(), distractorOf(first)));
    for (const r of optionsIn(q1())) expect(r).toBeDisabled();
    // Clicking the key afterwards must not turn the verdict green: the point of
    // a concept check is finding out what you knew, not what you can converge on.
    fireEvent.click(radioFor(q1(), keyOf(first)));
    expect(within(q1()).getByText(/^Not quite\./)).toBeInTheDocument();
  });

  it("keeps a running tally, and offers a way to start over", () => {
    render(<Page15 />);
    expect(screen.getByText(/right of 0 answered, 10 in all/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start over/i })).toBeNull();

    fireEvent.click(radioFor(q1(), keyOf(QUIZ[0])));
    expect(screen.getByText(/right of 1 answered, 10 in all/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByText(/right of 0 answered, 10 in all/)).toBeInTheDocument();
    for (const r of optionsIn(q1())) expect(r).not.toBeDisabled();
  });

  it("scores the whole set once every question is answered", () => {
    render(<Page15 />);
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
    render(<Page15 />);
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
    render(<Page15 />);
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
    render(<Page15 />);
    const one = screen.getByText(/Letting the model reason wins/i).closest("section")!;
    // The counterweight must travel with it, or the takeaway reads as "more is
    // better". It is stated in words now rather than in a token multiple, so the
    // guard is on the claim: forcing costs more and does not pay.
    expect(one.textContent).toMatch(/costs a great deal more/i);
    expect(one.textContent).toMatch(/as many answers wrong as it turns right/i);
    expect(one.textContent).toMatch(/not worth forcing/i);
  });

  it("says a trained judge helps and prices it", () => {
    render(<Page15 />);
    const three = screen.getByText(/a trained judge helps/i).closest("section")!;
    expect(three.textContent).toMatch(/trained to score/);
    // The cost has to be in the same breath, or "get a better judge" reads free.
    // Priced in words now, but it must still say that matching a bigger model this
    // way costs more than simply using the bigger model.
    expect(three.textContent).toMatch(/costs many times more compute/i);
    expect(three.textContent).toMatch(/simply using the bigger model/i);
  });

  it("offers adaptive compute as a direction and prints its own null beside it", () => {
    render(<Page15 />);
    const four = screen.getByText(/Adaptive compute is where that points/i).closest("section")!;
    expect(four.textContent).toMatch(/Spend more on the hard questions/i);
    // Proposing it without page 15's oracle result would be selling a technique
    // this deck measured and could not make work.
    expect(ADAPTIVE_NULL.beatsResampling).toBe(false);
    expect(four.textContent).toMatch(/no more per unit of compute than plain resampling/i);
  });

  it("keeps the pay-for-every-node lesson, and says why search has no bar", () => {
    render(<Page15 />);
    const five = screen.getByText(/you pay for every node you look at/i).closest("section")!;
    expect(five.textContent).toMatch(/before you can judge it/i);
    expect(five.textContent).toMatch(/never ran it/i);
    expect(five.textContent).toMatch(/second, larger model in memory/i);
    // Search has no rung, and must not acquire one without a run behind it.
    expect([...BASE_CHART, ...INSTRUCT_CHART, ...GRPO_CHART].some((b) => b.run === 10)).toBe(false);
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
    render(<Page15 />);
    expect(screen.queryByText(/What this deck did not settle/i)).toBeNull();
    // The open question, in the simpler closing (author, 2026-11-09).
    expect(
      screen.getByText(/no one has yet shown that the reasoning a\s+model writes out is what actually produces its answer/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/That is where the field stands today, and now so do you\./)).toBeInTheDocument();
    expect(screen.queryByText(/The one sentence to leave with/)).toBeNull();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced across the deck: visible copy uses commas,
    // colons or semicolons, and ranges are spelled out ("7 to 30 points").
    // Covers aria-labels and chart titles, which screen readers speak.
    const { container } = render(<Page15 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });
});
