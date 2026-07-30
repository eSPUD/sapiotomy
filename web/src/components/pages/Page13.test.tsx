import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("starts section 1 from page 12's shared listing, labelled confirmed frame · rumored recipe", () => {
    render(<Page13 />);
    expect(screen.getByText("confirmed frame · rumored recipe")).toBeInTheDocument();
    // The STaR side renders the shared lines verbatim (M₀ is markup, so match
    // the assembled code text as Page12.test does).
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "M ← finetune(M0, kept)",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/hint = y/)).toBeInTheDocument();
    expect(screen.getByText(/exactly the loop you already ran/)).toBeInTheDocument();
  });

  it("cites the confirmed frame: the announcement and the LRM definition", () => {
    render(<Page13 />);
    expect(screen.getByText(/large reasoning models \(LRMs\)/)).toBeInTheDocument();
    expect(screen.getByText(/The algorithm itself was never published\./)).toBeInTheDocument();
  });

  it("dropping the disguise rewrites four lines, strikes the hint branch, and says rumor", () => {
    render(<Page13 />);
    fireEvent.click(screen.getByRole("switch", { name: /Drop the disguise/ }));
    // The four rewrites.
    expect(screen.getByText("loop: while the compute budget lasts")).toBeInTheDocument();
    expect(screen.getByText("r₁…r_k, ŷ₁…ŷ_k ← M(x)")).toBeInTheDocument();
    expect(screen.getByText("rewardᵢ ← check(ŷᵢ, y)")).toBeInTheDocument();
    expect(screen.getByText("M ← reinforce(M, rewards)")).toBeInTheDocument();
    // The replaced originals are gone; the struck hint branch is still shown.
    expect(
      screen.queryByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "M ← finetune(M0, kept)",
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/hint = y/)).toBeInTheDocument();
    expect(screen.getByText(/promoted to an explicit reward/)).toBeInTheDocument();
    expect(screen.getByText(/rumor, not/)).toBeInTheDocument();
  });

  it("carries the build-ons: no human in the loop, and page 3's data wall unpriced", () => {
    render(<Page13 />);
    expect(screen.getByText(/RLHF, pays people to judge outputs/)).toBeInTheDocument();
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

  it("keeps the waterfall as mechanisms, model names demoted to parentheses", () => {
    render(<Page13 />);
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

  it("replaces it with the generality ablation, o3 appearing once as the law applied again", () => {
    render(<Page13 />);
    expect(screen.getByText("One recipe, no domain tricks")).toBeInTheDocument();
    expect(screen.getByText(/o1-ioi/)).toBeInTheDocument();
    expect(screen.getByText(/took gold outright/)).toBeInTheDocument();
    expect(screen.getByText(/the law held/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /general-purpose reinforcement learning, rather than relying on domain-specific techniques/,
      ),
    ).toBeInTheDocument();
    // o3's AIME anchor appears exactly once, in that sentence, not in a table.
    expect(screen.getAllByText(/96\.7/).length).toBe(1);
  });

  it("draws the boundary as a ledger: what exists, who reads it, who pays", () => {
    render(<Page13 />);
    expect(screen.getByText("What exists")).toBeInTheDocument();
    expect(screen.getByText("Who can read it")).toBeInTheDocument();
    expect(screen.getByText("Who pays for it")).toBeInTheDocument();
    expect(screen.getByText("The raw chain of thought")).toBeInTheDocument();
    expect(screen.getByText(/every thinking token billed, sight unseen/)).toBeInTheDocument();
    expect(screen.getByText(/it is all you ever see/)).toBeInTheDocument();
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

  it("orders the page: loop-diff, lab, waterfall, ablation, ledger, handoff", () => {
    render(<Page13 />);
    const diff = screen.getByText(/Flip the switch and watch which lines survive\./);
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

  it("links all four references from the sidenotes, all flagged preprint", () => {
    render(<Page13 />);
    const hrefs = [
      "https://openai.com/index/learning-to-reason-with-llms/",
      "https://arxiv.org/abs/2502.06807",
      "https://arcprize.org/blog/oai-o3-pub-breakthrough",
      "https://openai.com/index/openai-o1-system-card/",
    ];
    for (const href of hrefs) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
    // None of the four sources is peer-reviewed.
    expect(screen.getAllByText("preprint").length).toBe(4);
  });

  it("labels the footer provenance as Simulated and Cited, with the rumor disclaimer", () => {
    render(<Page13 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/rumor,\s*labelled as such/)).toBeInTheDocument();
  });
});
