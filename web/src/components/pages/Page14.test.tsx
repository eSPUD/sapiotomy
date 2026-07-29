import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { Page14 } from "./Page14";

const setStep = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /RL training step/i }), {
    target: { value: String(value) },
  });

describe("Page 14 (DeepSeek-R1, GRPO, and the aha moment)", () => {
  it("pins the distilled-model table to DeepSeek-AI 2025 Table 5", () => {
    // AIME 2024 pass@1 per dense model size, verbatim.
    expect(curves.deepseekDistill.points).toEqual([
      { x: 1.5, y: 28.9 },
      { x: 7, y: 55.5 },
      { x: 8, y: 50.4 },
      { x: 14, y: 69.7 },
      { x: 32, y: 72.6 },
      { x: 70, y: 70.0 },
    ]);
    const p = curves.deepseekDistill.fit!.params;
    expect(p.r1Aime).toBe(79.8);
    expect(p.r1Math).toBe(97.3);
    expect(p.r1Gpqa).toBe(71.5);
    expect(p.r1CfElo).toBe(2029);
    expect(p.o1miniAime).toBe(63.6);
    expect(p.math14).toBe(93.9);
  });

  it("opens at step 0: 15.6% pass@1 and a scratchpad with no second thoughts", () => {
    render(<Page14 />);
    expect(screen.getByText("15.6%")).toBeInTheDocument();
    // The length readout sits beside the accuracy readout, at its starting value.
    expect(screen.getByText("≈1,000")).toBeInTheDocument();
    expect(screen.queryByText(/aha moment I can flag here/)).not.toBeInTheDocument();
  });

  it("scrubbing to the end reaches 71.0% / ≈9,000 tokens and surfaces the verbatim aha passage", () => {
    render(<Page14 />);
    setStep(8000);
    expect(screen.getByText("71.0%")).toBeInTheDocument();
    expect(screen.getByText("≈9,000")).toBeInTheDocument();
    expect(
      screen.getByText(/Wait, wait\. Wait\. That's an aha moment I can flag here\./),
    ).toBeInTheDocument();
    // cons@64 matching o1-0912 is stated alongside.
    expect(screen.getByText(/86\.7/)).toBeInTheDocument();
  });

  it("plots both training variables on one dual-axis chart, with the aha step marked", () => {
    render(<Page14 />);
    const chart = screen.getByRole("img", { name: /two y axes/i });
    expect(chart.getAttribute("aria-label")).toMatch(/15\.6 percent .* 71\.0 percent/);
    expect(chart.getAttribute("aria-label")).toMatch(/1,000 to about 9,000 tokens/);
    expect(chart.getAttribute("aria-label")).toMatch(/aha trace appears \(illustrative placement\)/);
  });

  it("draws the distillation trade as a scatter: families, teacher, o1-mini line, ~48× span", () => {
    render(<Page14 />);
    const scatter = screen.getByRole("img", { name: /against total parameters/i });
    const label = scatter.getAttribute("aria-label")!;
    expect(label).toMatch(/Qwen-14B 69\.7 percent/);
    expect(label).toMatch(/Qwen-32B 72\.6 percent/);
    expect(label).toMatch(/Llama-70B 70 percent/);
    expect(label).toMatch(/671B mixture-of-experts, sits at 79\.8 percent/);
    expect(label).toMatch(/o1-mini at 63\.6 percent \(parameter count undisclosed\)/);
    expect(label).toMatch(/48 times parameter gap/);
  });

  it("tags the page Act 3 and closes with the two-label provenance footer", () => {
    render(<Page14 />);
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/verbatim from Table 3\./)).toBeInTheDocument();
  });

  it("keeps the mid stage strictly forward: longer trace, still no aha", () => {
    render(<Page14 />);
    setStep(3000);
    expect(screen.getByText(/square again/)).toBeInTheDocument();
    expect(screen.queryByText(/aha moment I can flag here/)).not.toBeInTheDocument();
  });

  it("defaults the distill picker to Qwen-14B and updates on selection", () => {
    render(<Page14 />);
    expect(screen.getByRole("button", { name: /Qwen-14B/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/R1-Distill-Qwen-14B/)).toBeInTheDocument();
    expect(screen.getByText("93.9%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Qwen-32B/ }));
    expect(screen.getByText(/R1-Distill-Qwen-32B/)).toBeInTheDocument();
    expect(screen.getByText("94.3%")).toBeInTheDocument();
    expect(screen.getByText(/Within ~7 points of the 671B teacher/)).toBeInTheDocument();
  });

  it("GRPO demo: pushes are group-relative, and a uniform group teaches nothing", () => {
    render(<Page14 />);
    // Default group [✓ ✗ ✗ ✓]: mean 0.50, pushes ±0.50.
    expect(screen.getByText("0.50")).toBeInTheDocument();
    expect(screen.getAllByText("+0.50")).toHaveLength(2);
    expect(screen.queryByText(/teaches it nothing/)).not.toBeInTheDocument();

    // Flip both right answers wrong: all rewards 0 → every push 0.00.
    fireEvent.click(screen.getByRole("button", { name: /Resample answer 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /Resample answer 4/i }));
    expect(screen.getByText(/teaches it nothing/)).toBeInTheDocument();
    expect(screen.getAllByText("0.00").length).toBeGreaterThanOrEqual(4);
  });
});
