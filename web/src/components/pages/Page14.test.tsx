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
    // The aha note, with its doubt trigger, belongs to the aha stage only.
    expect(screen.queryByText(/doubts what it has just written/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Nothing scored those steps/)).not.toBeInTheDocument();
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
    expect(screen.queryByText(/doubts what it has just written/)).not.toBeInTheDocument();
  });

  it("gives the interrupt a reason, and never calls it a located mistake", () => {
    render(<Page14 />);
    setStep(8000);
    // The trigger is stated: the trace doubts the step it just wrote.
    expect(screen.getByText(/doubts what it has just written/)).toBeInTheDocument();
    // And the reason it cannot be error-detection: section 1's reward is
    // outcome-only, so nothing ever scored an individual step.
    expect(screen.getByText(/Nothing scored those steps/)).toBeInTheDocument();
    // Page 10's missing middle verb, restored: branch, score, backtrack.
    expect(screen.getByText(/Page 10's branch, score, backtrack/)).toBeInTheDocument();
    // The suspect step is marked in the figure, not just in the caption.
    const skeleton = screen.getByRole("img", { name: /trace skeleton after the aha/i });
    expect(skeleton.getAttribute("aria-label")).toMatch(/the step the trace doubts/i);
    // Guard: a later tightening pass must not turn the doubt into a found
    // error. That would contradict the outcome-only reward two sections up.
    expect(
      screen.queryByText(/found (a |an )?(mistake|error)|wrong step|catches (a|its) (mistake|error)/i),
    ).not.toBeInTheDocument();
  });

  it("bridges each section to the toolbox it absorbs, without a chain of page cites", () => {
    render(<Page14 />);
    // Section 1: GRPO's line 2 is page 7's sampling, moved across the line.
    expect(screen.getByText(/Page 7 sampled many chains and picked among them at answer time/)).toBeInTheDocument();
    expect(screen.getByText(/sampling paid for once, instead of on every question/)).toBeInTheDocument();
    // Section 2: the page 11 link is axis furniture now, not a sentence.
    const training = screen.getByRole("img", { name: /two y axes/i });
    expect(training.getAttribute("aria-label")).toMatch(/page 11's test-time compute/);
    // Section 2 answers page 13's first open question, beside the skeleton
    // that shows a single unbroken trace rather than above the chart.
    expect(screen.getByText(/allowed to run longer\. Not many chains sampled and voted/)).toBeInTheDocument();
    // The lede answers page 13's questions rather than restating the frame.
    expect(screen.getByText(/four questions about what sits behind the thinking dial/)).toBeInTheDocument();
  });

  it("shows the reader what settles page 13's questions, never recaps them as answers", () => {
    render(<Page14 />);
    // The chain is the reinforced object, so it cannot be a commentary written
    // beside the real work. Argument in the flow of section 2, not a Q&A entry.
    expect(screen.getByText(/the chain is what the model sampled and what training pushed on/)).toBeInTheDocument();
    expect(screen.getByText(/Re-derivation is not narration/)).toBeInTheDocument();
    // Guard: page 13's questions are answered by the figures the reader drives,
    // so the page must never grow a recap block that hands the answers over.
    expect(screen.queryByText(/The four questions o1 could not answer/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^\s*(What|Whether) the (thinking|model|law)/)).not.toBeInTheDocument();
  });

  it("keeps setup above each figure and meaning below it", () => {
    render(<Page14 />);
    // Section 2 poses the puzzle above the chart and never narrates the curves
    // before the reader sees them.
    expect(screen.getByText(/Nothing in the reward mentions length/)).toBeInTheDocument();
    expect(screen.queryByText(/accuracy climbs and flattens while average response length/)).not.toBeInTheDocument();
    // The reading lands after the chart.
    const chart = screen.getByRole("img", { name: /two y axes/i });
    const meaning = screen.getByText(/Length is not a schedule anyone set/).closest("p")!;
    expect(chart.compareDocumentPosition(meaning) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("hands section 1's figure its own setup, and its instruction to the margin", () => {
    render(<Page14 />);
    // The problem is the chart's title now, not a text block above it.
    const group = screen.getByRole("img", { name: /Line 2 of the recipe, drawn/ });
    expect(group.getAttribute("aria-label")).toMatch(/350 times 638/);
    expect(screen.queryByText(/Ask four times and the answers differ/)).not.toBeInTheDocument();
    // Page 2's grammar: a single imperative sentence in the margin.
    expect(screen.getByText(/Drag the dial: the group's luck changes/)).toBeInTheDocument();
  });

  it("frames distillation as inference-time scaling, not as an R1 result", () => {
    render(<Page14 />);
    // The asymmetry page 13's law carried, and the thing that collapses it.
    expect(screen.getByText(/lifting the curve took frontier-scale RL/)).toBeInTheDocument();
    expect(screen.getByText(/The curve-lifting knob got cheap/)).toBeInTheDocument();
    // Honest about what distillation does not do: the RL was still paid for.
    expect(screen.getByText(/someone still paid for\s+the RL once/)).toBeInTheDocument();
    // Page 3's wall, completed in one line.
    expect(screen.getByText(/One good reasoner now writes the\s+curriculum for everyone else/)).toBeInTheDocument();
  });

  it("carries each reference exactly once, beside its first use", () => {
    render(<Page14 />);
    // Ref 1 sits with the lede/section 1; section 3 must not repeat it.
    expect(screen.getAllByText(/DeepSeek-R1: Incentivizing Reasoning Capability/)).toHaveLength(1);
    expect(screen.queryByText(/Tables 4–5\. Distilled weights released/)).not.toBeInTheDocument();
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
    // The PPO contrast is one caption line on the listing, not a body paragraph.
    expect(screen.getByText(/no critic network anywhere, which at 671B parameters/)).toBeInTheDocument();
  });

  it("GRPO dial: the baseline chases the group and the same right answer's push shrinks", () => {
    render(<Page14 />);
    // Default: one other sample also right → group [✓ ✓ ✗ ✗], mean 0.50, pushes ±0.50.
    expect(screen.getByText(/group mean · 0\.50/)).toBeInTheDocument();
    expect(screen.getAllByText("+0.50")).toHaveLength(2);
    expect(screen.getByText(/push drops to \+0\.50/)).toBeInTheDocument();
    // The wrong answers are named slips, not invented numbers.
    expect(screen.getByText("mis-added the partials")).toBeInTheDocument();
    expect(screen.getByText("dropped a zero")).toBeInTheDocument();

    // Lone right answer: the biggest push on offer — and all three slips visible.
    setLuck(0);
    expect(screen.getByText("+0.75")).toBeInTheDocument();
    expect(screen.getByText(/the biggest push on offer/)).toBeInTheDocument();
    expect(screen.getByText("read 638 as 628")).toBeInTheDocument();

    // Rarity cuts both ways: the lone wrong answer is punished hardest.
    setLuck(2);
    expect(screen.getByText("−0.75")).toBeInTheDocument();
    expect(screen.getByText(/Rarity amplifies the signal in both directions/)).toBeInTheDocument();

    // Uniform group: the rule reaches the dots, every arrow vanishes.
    setLuck(3);
    expect(screen.getByText(/teaches it nothing/)).toBeInTheDocument();
    expect(screen.getByText(/group mean · 1\.00/)).toBeInTheDocument();
    expect(screen.queryByText(/[+−]0\.\d\d/)).not.toBeInTheDocument();
  });

  it("defaults the distill picker to Qwen-14B and updates on selection", () => {
    render(<Page14 />);
    expect(screen.getByRole("button", { name: /Qwen-14B/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/R1-Distill-Qwen-14B/)).toBeInTheDocument();
    expect(screen.getByText(/best open reasoning model that existed the week before/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Qwen-32B/ }));
    expect(screen.getByText(/R1-Distill-Qwen-32B/)).toBeInTheDocument();
    expect(screen.getByText(/within seven points of the 671B teacher/)).toBeInTheDocument();
  });

  it("draws the distillation trade as a dot plot: rows by size, closed models as rules", () => {
    render(<Page14 />);
    const plot = screen.getByRole("img", { name: /horizontal dot plot/i });
    const label = plot.getAttribute("aria-label")!;
    expect(label).toMatch(/Qwen-14B 69\.7 percent/);
    expect(label).toMatch(/Qwen-32B 72\.6 percent/);
    expect(label).toMatch(/Llama-70B 70 percent/);
    expect(label).toMatch(/671B mixture-of-experts, at 79\.8 percent/);
    expect(label).toMatch(/GPT-4o at 9\.3 percent and OpenAI o1-mini at 63\.6 percent/);
    expect(label).toMatch(/undisclosed sizes/);
    expect(label).toMatch(/Llama-70B sits left of Qwen-32B/);
  });

  it("drops the scoreboard tiles and hands off to page 15", () => {
    render(<Page14 />);
    // The four headline stat tiles are gone: one number places the teacher and
    // the rest is beside the point, and the cold start is a caption clause.
    expect(screen.queryByText("GPQA Diamond")).not.toBeInTheDocument();
    expect(screen.getByText(/adds a small cold start of curated traces/)).toBeInTheDocument();
    expect(screen.getByText(/a lifted curve fits in weights you can download/)).toBeInTheDocument();
    // The handoff aimed at The Scoreboard until that page was cut on
    // 2026-08-10. Page 15 is now "When Reasoning Breaks", so it aims there.
    expect(
      screen.getByText(/the side of that dial where thinking longer makes the answer worse/),
    ).toBeInTheDocument();
  });

  it("tags the page Act 3 and closes with the two-label provenance footer", () => {
    render(<Page14 />);
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/schematic of the Table 3 trace/)).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced: visible copy uses commas, colons, or
    // semicolons instead, and ranges are spelled out ("1.5B to 70B"). This
    // covers aria-labels and chart titles too, which screen readers speak.
    const { container } = render(<Page14 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [
        el.textContent ?? "",
        el.getAttribute("aria-label") ?? "",
      ])
      .filter((t) => t.includes("\u2014") || t.includes("\u2013"));
    expect(offenders).toEqual([]);
  });
});
