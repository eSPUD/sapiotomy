import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { Page14 } from "./Page14";

const setStep = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /RL training step/i }), {
    target: { value: String(value) },
  });

const setLuck = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /how many are also right/i }), {
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

  it("opens at step 0: 15.6% pass@1 and a strictly forward trace skeleton", () => {
    render(<Page14 />);
    expect(screen.getByText("15.6%")).toBeInTheDocument();
    // The length readout sits beside the accuracy readout, at its starting value.
    expect(screen.getByText("≈1,000")).toBeInTheDocument();
    const skeleton = screen.getByRole("img", { name: /trace skeleton, early in training/i });
    expect(skeleton.getAttribute("aria-label")).toMatch(/three steps forward/i);
    expect(skeleton.getAttribute("aria-label")).not.toMatch(/loops back/i);
    expect(screen.queryByText(/loops back to its own first line/)).not.toBeInTheDocument();
  });

  it("scrubbing to the end reaches 71.0% / ≈9,000 tokens and the skeleton grows its loop", () => {
    render(<Page14 />);
    setStep(8000);
    expect(screen.getByText("71.0%")).toBeInTheDocument();
    expect(screen.getByText("≈9,000")).toBeInTheDocument();
    const skeleton = screen.getByRole("img", { name: /trace skeleton after the aha/i });
    expect(skeleton.getAttribute("aria-label")).toMatch(/loops back to its own first line/i);
    expect(skeleton.getAttribute("aria-label")).toMatch(/second pass/i);
    // The stage note ties the loop to the right axis's extra tokens.
    expect(screen.getByText(/The extra tokens on the right axis are these loops/)).toBeInTheDocument();
    // cons@64 matching o1-0912 is stated alongside.
    expect(screen.getByText(/86\.7/)).toBeInTheDocument();
  });

  it("keeps the mid stage strictly forward: longer skeleton, still no loop", () => {
    render(<Page14 />);
    setStep(3000);
    const skeleton = screen.getByRole("img", { name: /trace skeleton, mid training/i });
    expect(skeleton.getAttribute("aria-label")).toMatch(/six steps forward/i);
    expect(skeleton.getAttribute("aria-label")).not.toMatch(/loops back/i);
  });

  it("plots both training variables on one dual-axis chart, with the aha step marked", () => {
    render(<Page14 />);
    const chart = screen.getByRole("img", { name: /two y axes/i });
    expect(chart.getAttribute("aria-label")).toMatch(/15\.6 percent .* 71\.0 percent/);
    expect(chart.getAttribute("aria-label")).toMatch(/1,000 to about 9,000 tokens/);
    expect(chart.getAttribute("aria-label")).toMatch(/no term in the reward mentions length/);
    expect(chart.getAttribute("aria-label")).toMatch(/aha trace appears \(illustrative placement\)/);
  });

  it("teaches GRPO as pseudocode: rule reward, group baseline, no critic", () => {
    render(<Page14 />);
    expect(screen.getByText(/sample G answers from the current policy/)).toBeInTheDocument();
    expect(screen.getByText(/mean\(r\)\) \/ std\(r\)/)).toBeInTheDocument();
    expect(screen.getByText(/the group is its own baseline: no critic network/)).toBeInTheDocument();
    expect(screen.getByText(/it is what made RL at this scale affordable/)).toBeInTheDocument();
  });

  it("GRPO dial: the same right answer earns a shrinking push as the group gets luckier", () => {
    render(<Page14 />);
    // Default: one other sample also right → group [✓ ✓ ✗ ✗], mean 0.50, pushes ±0.50.
    expect(screen.getByText("0.50")).toBeInTheDocument();
    expect(screen.getAllByText("+0.50")).toHaveLength(2);
    expect(screen.getByText(/push drops to \+0\.50/)).toBeInTheDocument();

    // Lone right answer: the biggest push on offer.
    setLuck(0);
    expect(screen.getByText("+0.75")).toBeInTheDocument();
    expect(screen.getByText(/the biggest push on offer/)).toBeInTheDocument();

    // Rarity cuts both ways: the lone wrong answer is punished hardest.
    setLuck(2);
    expect(screen.getByText("−0.75")).toBeInTheDocument();
    expect(screen.getByText(/Rarity amplifies the signal in both directions/)).toBeInTheDocument();

    // Uniform group: every push 0.00, nothing to learn.
    setLuck(3);
    expect(screen.getByText(/teaches it nothing/)).toBeInTheDocument();
    expect(screen.getAllByText("0.00").length).toBeGreaterThanOrEqual(4);
  });

  it("defaults the distill picker to Qwen-14B and updates on selection", () => {
    render(<Page14 />);
    expect(screen.getByRole("button", { name: /Qwen-14B/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/R1-Distill-Qwen-14B/)).toBeInTheDocument();
    expect(screen.getByText(/leading open reasoning model when R1 shipped/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Qwen-32B/ }));
    expect(screen.getByText(/R1-Distill-Qwen-32B/)).toBeInTheDocument();
    expect(screen.getByText(/within seven points of the 671B teacher/)).toBeInTheDocument();
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

  it("defers the scoreboard and hands off to page 15", () => {
    render(<Page14 />);
    // The four headline stat tiles are gone: one number places the teacher,
    // the rest waits for The Scoreboard.
    expect(screen.getByText(/The rest of its scoreboard can wait one page/)).toBeInTheDocument();
    expect(screen.queryByText("GPQA Diamond")).not.toBeInTheDocument();
    expect(screen.getByText(/reasoning transfers as data/)).toBeInTheDocument();
    expect(screen.getByText(/Whether you should is the next page/)).toBeInTheDocument();
  });

  it("tags the page Act 3 and closes with the two-label provenance footer", () => {
    render(<Page14 />);
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/schematic of the Table 3 trace/)).toBeInTheDocument();
  });
});
