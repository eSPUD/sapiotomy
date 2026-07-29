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
  });

  it("draws the strip as an abstraction: frontier, state matrix, no notation", () => {
    render(<Page12 />);
    expect(screen.getByText(/solve frontier \(50\/50 odds\)/)).toBeInTheDocument();
    // The sidenote matrix maps each toggle state to what the reader watches.
    expect(screen.getByText("filter on · rationalization off")).toBeInTheDocument();
    expect(screen.getByText(/Full STaR/)).toBeInTheDocument();
    expect(screen.getByText(/No reward, no loop/)).toBeInTheDocument();
    // |Dₙ| is gone everywhere in favour of "problems it can learn from".
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

  it("explains the algorithm in plain language below the listing", () => {
    render(<Page12 />);
    expect(screen.getByText(/The algorithm, explained/)).toBeInTheDocument();
    expect(screen.getByText(/no worked solutions, only the answers/)).toBeInTheDocument();
  });

  it("wraps up in one dense block: RL in disguise, luck into skill, the filter caveat, Quiet-STaR", () => {
    render(<Page12 />);
    expect(screen.getByText(/reinforcement learning in disguise/)).toBeInTheDocument();
    expect(screen.getByText(/distills luck into skill/)).toBeInTheDocument();
    expect(screen.getByText(/only ever as sound as its filter/)).toBeInTheDocument();
    expect(screen.getByText(/carries its own answer key/)).toBeInTheDocument();
    expect(screen.queryByText(/V-STaR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReST/)).not.toBeInTheDocument();
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
