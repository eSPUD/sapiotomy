import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("opens the lineage stepper on STaR, with the hint retry drawn in", () => {
    render(<Page12 />);
    expect(screen.getByRole("button", { name: /STaR 2022/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("retry with a hint")).toBeInTheDocument();
    expect(screen.getByText(/the dataset accumulates, not the weights/)).toBeInTheDocument();
  });

  it("V-STaR mutates the diagram: many samples, the fork, no hint retry", () => {
    render(<Page12 />);
    fireEvent.click(screen.getByRole("button", { name: /V-STaR 2024/ }));
    expect(screen.getByText("sample many solutions per problem")).toBeInTheDocument();
    expect(screen.getByText(/D_GEN/)).toBeInTheDocument();
    expect(screen.getByText(/D_VER/)).toBeInTheDocument();
    expect(screen.queryByText("retry with a hint")).not.toBeInTheDocument();
    // The inference row: both models persist at test time.
    expect(screen.getByText("sample k candidates")).toBeInTheDocument();
  });

  it("Quiet-STaR deletes the oracle and needs no question-answer pairs", () => {
    render(<Page12 />);
    fireEvent.click(screen.getByRole("button", { name: /Quiet-STaR 2024/ }));
    expect(screen.getByText("any text — no questions, no answers")).toBeInTheDocument();
    expect(screen.getByText(/deleted/i)).toBeInTheDocument();
    expect(screen.queryByText(/D_GEN/)).not.toBeInTheDocument();
  });

  it("mentions ReST-EM as a cited claim in the transition, not a stepper position", () => {
    render(<Page12 />);
    expect(screen.queryByRole("button", { name: /ReST/ })).not.toBeInTheDocument();
    expect(screen.getByText(/scales with model size/)).toBeInTheDocument();
  });

  it("labels the footer provenance as Simulated and Cited", () => {
    render(<Page12 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/Table 1, CommonsenseQA dev/)).toBeInTheDocument();
  });
});
