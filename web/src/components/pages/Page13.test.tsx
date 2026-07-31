import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page13 } from "./Page13";

const follows = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Page 13 (frontier reasoners I)", () => {
  it("opens on the lede: the two ways to buy reasoning, both dials at once", () => {
    render(<Page13 />);
    // The lede picks up page 12's hand-off: Act 2's answer-time toolbox and
    // page 12's train-time loop are both named, so the two compute axes below
    // are the two threads the reader already holds. It must not re-open Act 3,
    // which started on page 12 (the seam is 11|12, see pages.ts).
    const lede = screen
      .getByText(/how much of the score did the training buy, and how much did the thinking\?/)
      .closest("p")!;
    expect(lede.textContent).toMatch(/spent at answer time/);
    expect(lede.textContent).toMatch(/already sunk into the weights/);
    expect(lede.textContent).toMatch(/first commercial model to turn both dials/);
    // Act 3 started on page 12, so the lede may not stage this page as its
    // opening (the seam is 11|12, see pages.ts).
    expect(lede.textContent).not.toMatch(/Act 2 ended/);
    expect(lede.textContent).toMatch(/kept the recipe/);
    // The seam must rhyme with page 12's closing block, not restate it: page 12
    // owns "two ways to buy reasoning / after the question lands / long before
    // the question exists", and the lede reaches the same pair in its own words.
    expect(lede.textContent).not.toMatch(/two ways to buy reasoning/);
    expect(lede.textContent).not.toMatch(/the question lands/);
    expect(lede.textContent).not.toMatch(/long before/);
  });

  it("prints NO o1 algorithm: the strip is the whole of what was confirmed", () => {
    render(<Page13 />);
    // The six-line rumored recipe was cut on review. It is a counterexample to
    // section 4 ("The questions o1 cannot answer"), it spends page 14's
    // promised "algorithm in full" a page early, and it is the one artifact in
    // the deck nobody outside OpenAI can check. Do not restore it.
    expect(screen.queryByText("loop: while the compute budget lasts")).not.toBeInTheDocument();
    expect(screen.queryByText("r₁…rₖ, ŷ₁…ŷₖ ← M(x)")).not.toBeInTheDocument();
    expect(screen.queryByText("rewardᵢ ← check(ŷᵢ, y)")).not.toBeInTheDocument();
    expect(screen.queryByText("M ← reinforce(M, rewards)")).not.toBeInTheDocument();
    expect(document.querySelector("code")).toBeNull();
    // And with no listing the page badges no rumor.
    expect(screen.queryByText("confirmed frame · rumored recipe")).not.toBeInTheDocument();
    expect(screen.queryByText(/rumor, not record/)).not.toBeInTheDocument();
    expect(screen.getByText("confirmed frame only")).toBeInTheDocument();
    // The boundary is stated, and page 14 is named as where a real one lives.
    expect(screen.getByText(/The shape is the whole of what was confirmed/)).toBeInTheDocument();
    expect(
      screen.getByText(/page 14 prints an algorithm from the lab that published it/),
    ).toBeInTheDocument();
  });

  it("carries the page-12 diff on the strip's three stations", () => {
    render(<Page13 />);
    // Same three stations, two renamed; each sub-label names what it was on
    // page 12, which is the whole loop-diff now that the listing is gone.
    const generate = screen.getByText("generate ×k");
    expect(screen.getByText("reward")).toBeInTheDocument();
    expect(screen.getByText("reinforce")).toBeInTheDocument();
    expect(screen.getByText(/page 12 took one greedy try/)).toBeInTheDocument();
    expect(screen.getByText(/page 12's filter, made explicit/)).toBeInTheDocument();
    expect(screen.getByText(/page 12 fine-tuned the base/)).toBeInTheDocument();
    // STaR itself is still never re-printed.
    expect(screen.queryByText(/hint = y/)).not.toBeInTheDocument();
    // The strip leads the section, ahead of the no-human callout.
    const callout = screen.getByText(/RLHF pays people to judge outputs/);
    expect(follows(generate, callout)).toBe(true);
  });

  it("cites the confirmed frame: the announcement and the LRM definition", () => {
    render(<Page13 />);
    expect(screen.getByText(/large reasoning models \(LRMs\)/)).toBeInTheDocument();
    expect(screen.getByText(/The algorithm itself was never published\./)).toBeInTheDocument();
  });

  it("carries the build-ons: no human in the loop, and page 3's data wall unpriced", () => {
    render(<Page13 />);
    expect(screen.getByText(/RLHF pays people to judge outputs/)).toBeInTheDocument();
    expect(screen.getByText(/writes its own curriculum/)).toBeInTheDocument();
    // Section 2 restates the currency point against page 3's finite stock.
    expect(screen.getByText(/page 3's wall does not price/)).toBeInTheDocument();
  });

  it("frames the lab with page 11's idiom, curve-picker swapped for RL", () => {
    render(<Page13 />);
    expect(
      screen.getByText(/model size picks your curve; test-time compute slides you along it/),
    ).toBeInTheDocument();
    expect(screen.getByText(/RL training picks your curve now/)).toBeInTheDocument();
    expect(
      screen.getByText(/Thinking slides you along the curve; only training lifts it\./),
    ).toBeInTheDocument();
    // The lab itself survives: two sliders, the delta readout, the fidelity note.
    expect(screen.getByText("Thinking time (compute in one answer)")).toBeInTheDocument();
    expect(screen.getByText("RL training (compute in one training run)")).toBeInTheDocument();
    expect(screen.getByText("the missing RL's share")).toBeInTheDocument();
    expect(screen.getByText(/The slope is the claim; the absolute compute is a secret\./)).toBeInTheDocument();
  });

  it("says what the dials count and what the score is scored on", () => {
    render(<Page13 />);
    // Both dials are compute, never a count of runs or of sampled answers.
    expect(
      screen.getByText(/×100 RL training is one run given a hundred times the training compute/),
    ).toBeInTheDocument();
    expect(screen.getByText(/not a hundred sampled answers/)).toBeInTheDocument();
    // The benchmark is named in the prose, on the axis, and on the readout.
    expect(screen.getByText(/pass@1 on AIME 2024/)).toBeInTheDocument();
    expect(screen.getByText("AIME 2024 pass@1 (%)")).toBeInTheDocument();
    expect(screen.getByText("AIME 2024 pass@1 here")).toBeInTheDocument();
  });

  it("puts the instruction in the margin and the meaning in the card", () => {
    render(<Page13 />);
    // Pages 2/3 grammar: the Try-it note is a single imperative sentence.
    expect(
      screen.getByText(/all that thinking lands exactly where the full run/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/spend the other's decades/)).not.toBeInTheDocument();
    expect(screen.queryByText(/That equality is the law/)).not.toBeInTheDocument();
    // The interpretation lives in the card's closing line.
    expect(
      screen.getByText(/thinking walks your curve and never climbs to the next one/),
    ).toBeInTheDocument();
  });

  it("draws the whole run family at once, staircase stated, opening gap priced", () => {
    render(<Page13 />);
    const chart = screen.getByRole("img", {
      name: /Three RL training runs, each one run at a different training-compute budget, are drawn in full as parallel lines/,
    });
    expect(chart).toBeInTheDocument();
    // The law is stated statically: up one curve = along one decade = +29.5.
    expect(chart.getAttribute("aria-label")).toMatch(
      /times 10 more RL and times 10 more thinking buy the same 29\.5 points/,
    );
    // Default state opens mid-family with exactly one forgone decade priced.
    expect(chart.getAttribute("aria-label")).toMatch(
      /times 10 run at times 10 thinking, scoring 21\.0 percent, with 29\.5 points forgone/,
    );
  });

  it("keeps the waterfall as mechanisms, model names demoted to parentheses", () => {
    render(<Page13 />);
    expect(screen.getByText("3. Stack the toolbox, or turn the knobs?")).toBeInTheDocument();
    expect(screen.getByText("no learned chain")).toBeInTheDocument();
    expect(screen.getByText(/one instant answer from a strong LLM \(GPT-4o\)/)).toBeInTheDocument();
    expect(screen.getByText("+ page 7's voting")).toBeInTheDocument();
    expect(screen.getByText("+ page 8's re-ranker")).toBeInTheDocument();
  });

  it("cut the scoreboard: no benchmark table, no product chronology", () => {
    render(<Page13 />);
    expect(screen.queryByText(/o1 · Sept 2024/)).not.toBeInTheDocument();
    expect(screen.queryByText(/o3 · Dec 2024 preview/)).not.toBeInTheDocument();
    expect(screen.queryByText("GPQA Diamond (PhD science)")).not.toBeInTheDocument();
    expect(screen.queryByText("SWE-bench Verified (real bug fixes)")).not.toBeInTheDocument();
    expect(screen.queryByText(/Three months apart/)).not.toBeInTheDocument();
  });

  it("answers the knob half with the ablation in the deck's vocabulary, no scores", () => {
    render(<Page13 />);
    expect(screen.getByText("One recipe, no domain tricks")).toBeInTheDocument();
    expect(screen.getByText(/o1-ioi/)).toBeInTheDocument();
    expect(screen.getByText(/beat the hand-built specialist on its own contest/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /general-purpose reinforcement learning, rather than relying on domain-specific techniques/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Stacking pays once; the knobs compound\./)).toBeInTheDocument();
    // No benchmark retelling — medals, percentiles, and score pairs live on page 15.
    expect(screen.queryByText(/96\.7/)).not.toBeInTheDocument();
    expect(screen.queryByText(/49th percentile/)).not.toBeInTheDocument();
    expect(screen.queryByText(/gold/)).not.toBeInTheDocument();
    expect(screen.queryByText(/the law held/)).not.toBeInTheDocument();
  });

  it("asks the four questions a closed model cannot answer", () => {
    render(<Page13 />);
    expect(screen.getByText("4. The questions o1 cannot answer")).toBeInTheDocument();
    // Every question is about the thinking dial, not about opacity in general.
    const questions = [
      "What are you actually buying when you turn the thinking dial?",
      "Are the thinking tokens doing the work, or describing it?",
      "What does the model do with ten times the thinking that it would not do with one?",
      "Does the law need a frontier-scale model at all?",
    ];
    for (const q of questions) {
      expect(screen.getByText(q)).toBeInTheDocument();
    }
    // Asked in the order page 14 answers them.
    const rendered = questions.map((q) => screen.getByText(q));
    for (let i = 1; i < rendered.length; i++) {
      expect(follows(rendered[i - 1], rendered[i])).toBe(true);
    }
    expect(screen.getByText(/that is exactly what a closed lab keeps/)).toBeInTheDocument();
  });

  it("never narrates its own contribution: the subject is o1, not the deck", () => {
    render(<Page13 />);
    expect(screen.queryByText(/this page claimed/)).not.toBeInTheDocument();
    expect(screen.queryByText(/what this page/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/this page actually established/)).not.toBeInTheDocument();
    // The retrospective ledger and parts list are both gone.
    expect(screen.queryByText("What stays sealed")).not.toBeInTheDocument();
    expect(screen.queryByText("What you would be missing")).not.toBeInTheDocument();
  });

  it("hands off by answering all four, in the order they were asked", () => {
    render(<Page13 />);
    const lastQuestion = screen.getByText("Does the law need a frontier-scale model at all?");
    const closer = screen.getByText(
      /Four months later an open lab answered every one of them: the algorithm in full, a chain you can read token by token, a training curve that shows where the extra thinking comes from, and the whole thing distilled small enough to run yourself\./,
    );
    expect(screen.getByText(/Turn the page\./)).toBeInTheDocument();
    expect(follows(lastQuestion, closer)).toBe(true);
  });

  it("cut the safety essay: that thread is page 18's, not page 13's", () => {
    render(<Page13 />);
    expect(screen.queryByText(/The case for hiding:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/must be left untrained/)).not.toBeInTheDocument();
    expect(screen.queryByText(/0\.17%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/deceptive/)).not.toBeInTheDocument();
    expect(screen.queryByText("Who can read it")).not.toBeInTheDocument();
    // No back-reference chain through Act 2's pages (review).
    expect(screen.queryByText(/page 6/)).not.toBeInTheDocument();
    expect(screen.queryByText(/page 9/)).not.toBeInTheDocument();
    expect(screen.queryByText(/page 10/)).not.toBeInTheDocument();
  });

  it("orders the page: strip, lab, waterfall, ablation, open questions, handoff", () => {
    render(<Page13 />);
    const diff = screen.getByText("generate ×k");
    const lab = screen.getByText("Thinking time (compute in one answer)");
    const waterfall = screen.getByText("no learned chain");
    const ablation = screen.getByText("One recipe, no domain tricks");
    const open = screen.getByText("What are you actually buying when you turn the thinking dial?");
    const handoff = screen.getByText(/Turn the page\./);
    expect(follows(diff, lab)).toBe(true);
    expect(follows(lab, waterfall)).toBe(true);
    expect(follows(waterfall, ablation)).toBe(true);
    expect(follows(ablation, open)).toBe(true);
    expect(follows(open, handoff)).toBe(true);
  });

  it("links both surviving references from the sidenote, all flagged preprint", () => {
    render(<Page13 />);
    const hrefs = [
      "https://openai.com/index/learning-to-reason-with-llms/",
      "https://arxiv.org/abs/2502.06807",
    ];
    for (const href of hrefs) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
    // The ARC Prize o3-preview link left with the benchmark numbers; the system
    // card left with the safety essay.
    expect(document.querySelector('a[href*="arcprize.org"]')).not.toBeInTheDocument();
    expect(document.querySelector('a[href*="o1-system-card"]')).not.toBeInTheDocument();
    // Neither surviving source is peer-reviewed.
    expect(screen.getAllByText("preprint").length).toBe(2);
  });

  it("carries no Simulated/Cited footer — provenance is inline, as on pages 1-3", () => {
    render(<Page13 />);
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    // The inline declarations that replace it.
    expect(screen.getByText("confirmed frame only")).toBeInTheDocument();
    expect(screen.getByText("authored redrawing · anchors verbatim")).toBeInTheDocument();
    expect(screen.getByText(/The slope is the claim; the absolute compute is a secret\./)).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced: visible copy uses commas, colons, or
    // semicolons instead, and ranges are spelled out ("1.5B to 70B"). This
    // covers aria-labels and chart titles too, which screen readers speak.
    const { container } = render(<Page13 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [
        el.textContent ?? "",
        el.getAttribute("aria-label") ?? "",
      ])
      .filter((t) => t.includes("\u2014") || t.includes("\u2013"));
    expect(offenders).toEqual([]);
  });
});
