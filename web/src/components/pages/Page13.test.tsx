import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page13 } from "./Page13";

const follows = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("Page 13 (frontier reasoners I)", () => {
  it("opens on the lede: trained it in, kept the recipe, the two-axis question", () => {
    render(<Page13 />);
    expect(screen.getByText(/trained it in — and kept the recipe/)).toBeInTheDocument();
    expect(
      screen.getByText(/how much of the score did the training buy, and how much did the thinking\?/),
    ).toBeInTheDocument();
  });

  it("shows only the o1 recipe, mapped back to page 12 line by line, labelled rumor", () => {
    render(<Page13 />);
    expect(screen.getByText("confirmed frame · rumored recipe")).toBeInTheDocument();
    // The six-line rumored recipe.
    expect(screen.getByText("loop: while the compute budget lasts")).toBeInTheDocument();
    expect(screen.getByText("r₁…rₖ, ŷ₁…ŷₖ ← M(x)")).toBeInTheDocument();
    expect(screen.getByText("rewardᵢ ← check(ŷᵢ, y)")).toBeInTheDocument();
    expect(screen.getByText("M ← reinforce(M, rewards)")).toBeInTheDocument();
    // The annotations carry the diff against page 12; STaR is not re-printed.
    expect(screen.getByText(/promoted to an explicit reward/)).toBeInTheDocument();
    expect(screen.getByText(/hint branch is gone/)).toBeInTheDocument();
    expect(
      screen.queryByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "M ← finetune(M0, kept)",
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/hint = y/)).not.toBeInTheDocument();
    expect(screen.getByText(/rumor, not record/)).toBeInTheDocument();
  });

  it("draws the loop strip in page 12's stage grammar above the listing", () => {
    render(<Page13 />);
    // Same three stations, two renamed: the shape claim made visible.
    const generate = screen.getByText("generate ×k");
    expect(screen.getByText("reward")).toBeInTheDocument();
    expect(screen.getByText("reinforce")).toBeInTheDocument();
    expect(screen.getByText(/the filter, made explicit/)).toBeInTheDocument();
    // The strip precedes the listing: shape first, then the diff.
    const listing = screen.getByText("rewardᵢ ← check(ŷᵢ, y)");
    expect(follows(generate, listing)).toBe(true);
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
    expect(screen.getByText("Thinking time (test-time compute)")).toBeInTheDocument();
    expect(screen.getByText("RL training (train-time compute)")).toBeInTheDocument();
    expect(screen.getByText("the missing RL's share")).toBeInTheDocument();
    expect(screen.getByText(/The slope is the claim; the absolute compute is a secret\./)).toBeInTheDocument();
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
      name: /Three RL training runs are drawn in full as parallel lines/,
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

  it("draws the boundary as a ledger: what exists, who reads it, who pays", () => {
    render(<Page13 />);
    expect(screen.getByText("What exists")).toBeInTheDocument();
    expect(screen.getByText("Who can read it")).toBeInTheDocument();
    expect(screen.getByText("Who pays for it")).toBeInTheDocument();
    expect(screen.getByText("The raw chain of thought")).toBeInTheDocument();
    expect(screen.getByText(/every thinking token billed, sight unseen/)).toBeInTheDocument();
    expect(screen.getByText(/it is all you ever see/)).toBeInTheDocument();
    // Every cell carries words — an em-dash cell reads as a rendering bug.
    expect(screen.getByText(/no one extra — it arrives with the answer/)).toBeInTheDocument();
    expect(screen.getByText(/its own audit, run inside/)).toBeInTheDocument();
    expect(screen.getByText(/flagged 0\.17% of responses as deceptive/)).toBeInTheDocument();
  });

  it("keeps the three closing blocks verbatim and in place", () => {
    render(<Page13 />);
    expect(screen.getByText(/The case for hiding:/)).toBeInTheDocument();
    expect(
      screen.getByText(/a chain you can trust as a monitor must be left untrained/),
    ).toBeInTheDocument();
    expect(screen.getByText(/The price:/)).toBeInTheDocument();
    expect(
      screen.getByText(/nobody outside can audit the reasoning/),
    ).toBeInTheDocument();
    const closer = screen.getByText(
      /A closed lab proved the two-axis law and kept the recipe\. Within four months an open lab published one: weights, training curve, visible chain and all\./,
    );
    expect(closer).toBeInTheDocument();
    expect(screen.getByText(/Turn the page\./)).toBeInTheDocument();
    // Ordered: hiding, then price, then the handoff last.
    const hiding = screen.getByText(/The case for hiding:/);
    const price = screen.getByText(/The price:/);
    expect(follows(hiding, price)).toBe(true);
    expect(follows(price, closer)).toBe(true);
  });

  it("orders the page: recipe, lab, waterfall, ablation, ledger, handoff", () => {
    render(<Page13 />);
    const diff = screen.getByText("rewardᵢ ← check(ŷᵢ, y)");
    const lab = screen.getByText("Thinking time (test-time compute)");
    const waterfall = screen.getByText("no learned chain");
    const ablation = screen.getByText("One recipe, no domain tricks");
    const ledger = screen.getByText("Who pays for it");
    const handoff = screen.getByText(/Turn the page\./);
    expect(follows(diff, lab)).toBe(true);
    expect(follows(lab, waterfall)).toBe(true);
    expect(follows(waterfall, ablation)).toBe(true);
    expect(follows(ablation, ledger)).toBe(true);
    expect(follows(ledger, handoff)).toBe(true);
  });

  it("links all three references from the sidenotes, all flagged preprint", () => {
    render(<Page13 />);
    const hrefs = [
      "https://openai.com/index/learning-to-reason-with-llms/",
      "https://arxiv.org/abs/2502.06807",
      "https://openai.com/index/openai-o1-system-card/",
    ];
    for (const href of hrefs) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
    // The ARC Prize o3-preview link left with the benchmark numbers.
    expect(document.querySelector('a[href*="arcprize.org"]')).not.toBeInTheDocument();
    // None of the three sources is peer-reviewed.
    expect(screen.getAllByText("preprint").length).toBe(3);
  });

  it("carries no Simulated/Cited footer — provenance is inline, as on pages 1-3", () => {
    render(<Page13 />);
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    // The inline declarations that replace it.
    expect(screen.getByText("confirmed frame · rumored recipe")).toBeInTheDocument();
    expect(screen.getByText("authored redrawing · anchors verbatim")).toBeInTheDocument();
    expect(screen.getByText(/The slope is the claim; the absolute compute is a secret\./)).toBeInTheDocument();
  });
});
