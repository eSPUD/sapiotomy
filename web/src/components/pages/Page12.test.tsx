import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page12 } from "./Page12";

describe("Page 12 (STaR and self-improvement)", () => {
  it("opens on the two-sentence hook ending in the answer-key question", () => {
    render(<Page12 />);
    expect(
      screen.getByText(/What happens when you take the answer key away\?/),
    ).toBeInTheDocument();
  });

  it("quotes the full Table 1 row set, including the 23x larger LaMDA bar", () => {
    render(<Page12 />);
    expect(screen.getByText("LaMDA 137B, few-shot CoT")).toBeInTheDocument();
    expect(screen.getByText("55.6%")).toBeInTheDocument();
    // The headline figures repeat in the figcaption; the bars are one each.
    expect(screen.getAllByText("72.5%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("73.0%").length).toBeGreaterThanOrEqual(1);
  });

  it("keeps the training and test regimes apart with labelled panels", () => {
    render(<Page12 />);
    expect(screen.getByText(/Training · what this round produced/)).toBeInTheDocument();
    expect(screen.getByText(/Test · how good did it get\?/)).toBeInTheDocument();
    // The Test panel carries the figure's only chart: an accuracy sparkline.
    expect(screen.getByRole("img", { name: /Held-out accuracy across 0 iterations/ })).toBeInTheDocument();
    // The legend renders only non-empty categories; nothing is verified yet.
    expect(screen.queryByText(/verified rationale/)).not.toBeInTheDocument();
    expect(screen.getByText(/not in the set \(60\)/)).toBeInTheDocument();
  });

  it("draws the strip as an abstraction: frontier, state matrix, no notation", () => {
    render(<Page12 />);
    expect(screen.getByText(/solve frontier \(50\/50 odds\)/)).toBeInTheDocument();
    // The sidenote matrix maps each toggle state to what the reader watches.
    expect(screen.getByText("filter on · rationalization off")).toBeInTheDocument();
    expect(screen.getByText(/Full STaR/)).toBeInTheDocument();
    expect(screen.getByText(/No reward, no loop/)).toBeInTheDocument();
    // No notation anywhere: the strip and sparkline carry the mechanism.
    expect(screen.queryByText(/Dₙ/)).not.toBeInTheDocument();
    expect(screen.getByText(/a training set it could not/)).toBeInTheDocument();
  });

  it("carries the GSM8K caveat on the rationalization claim", () => {
    render(<Page12 />);
    expect(screen.getByText(/did not substantially improve GSM8K/)).toBeInTheDocument();
  });

  it("states the calibration anchors the simulation reproduces", () => {
    render(<Page12 />);
    expect(screen.getByText(/GPT-J few-shot CoT: 36\.6%/)).toBeInTheDocument();
    expect(screen.getByText(/STaR's 68\.8%/)).toBeInTheDocument();
  });

  it("writes the loop down, with the rationalization branch and fine-tune-from-base", () => {
    render(<Page12 />);
    expect(screen.getByText(/hint = y/)).toBeInTheDocument();
    // M₀ is markup (M<sub>0</sub>), so match the assembled text of the code line.
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "M ← finetune(M0, kept)",
      ),
    ).toBeInTheDocument();
  });

  it("explains the algorithm in plain language above the listing", () => {
    render(<Page12 />);
    const explained = screen.getByText(/The algorithm, explained/);
    const listing = screen.getByText(/hint = y/);
    expect(
      explained.compareDocumentPosition(listing) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps one counterweight below the listing: trained on reasoning, graded on answers", () => {
    render(<Page12 />);
    expect(screen.getByText(/Trained on reasoning, graded on answers/)).toBeInTheDocument();
    expect(screen.getByText(/it's imitated/)).toBeInTheDocument();
    // The RL reading lives in the annotation column, not a separate block.
    expect(screen.getAllByText(/in RL terms:/).length).toBe(2);
    expect(screen.queryByText(/V-STaR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReST/)).not.toBeInTheDocument();
    // STaR decodes greedily — the "distills luck into skill" story is wrong and must stay out.
    expect(screen.queryByText(/luck into skill/)).not.toBeInTheDocument();
  });

  it("closes on the hand-off to page 13's frontier reasoners", () => {
    render(<Page12 />);
    expect(screen.getByText(/Page 13 picks it up from there/)).toBeInTheDocument();
  });

  it("labels the footer provenance as Simulated and Cited", () => {
    render(<Page12 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/Table 1, CommonsenseQA dev/)).toBeInTheDocument();
  });
});
