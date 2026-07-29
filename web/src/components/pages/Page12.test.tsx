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
    expect(screen.getByText(/finetune\(M₀, kept\)/)).toBeInTheDocument();
  });

  it("reads the listing a second time, as reinforcement learning in disguise", () => {
    render(<Page12 />);
    expect(screen.getByText(/Reinforcement learning in disguise/)).toBeInTheDocument();
    expect(screen.getByText(/binary reward/)).toBeInTheDocument();
    expect(screen.getByText(/distills luck into skill/)).toBeInTheDocument();
  });

  it("carries the poisoning caveat: the filter checks answers, not reasoning", () => {
    render(<Page12 />);
    expect(screen.getByText(/only ever as sound as its filter/)).toBeInTheDocument();
  });

  it("introduces Quiet-STaR as a generalization, with the lineage gone", () => {
    render(<Page12 />);
    expect(screen.getByText(/Quiet-STaR, in one move/)).toBeInTheDocument();
    expect(screen.getByText(/the sentence that follows it/)).toBeInTheDocument();
    expect(screen.queryByText(/V-STaR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReST/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /2024/ })).not.toBeInTheDocument();
  });

  it("closes on the hand-off to o1-class reasoners", () => {
    render(<Page12 />);
    expect(screen.getByText(/with the disguise off/)).toBeInTheDocument();
  });

  it("labels the footer provenance as Simulated and Cited", () => {
    render(<Page12 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/Table 1, CommonsenseQA dev/)).toBeInTheDocument();
  });
});
