import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { IsoComputeExplorer } from "./IsoComputeExplorer";
import { ISO_BUDGETS, optimumAt } from "@/lib/scalingLaw";

describe("IsoComputeExplorer", () => {
  it("offers six budgets, each ten times the last, opening on 10²³ FLOPs", () => {
    render(<IsoComputeExplorer />);
    const radios = within(screen.getByRole("radiogroup", { name: "Training budget" })).getAllByRole("radio");
    // Spoken as "10 to the n"; drawn as 10 with a raised exponent (a real <sup>).
    expect(radios.map((r) => within(r).getByText(/^10 to the/).textContent)).toEqual([
      "10 to the 20",
      "10 to the 21",
      "10 to the 22",
      "10 to the 23",
      "10 to the 24",
      "10 to the 25",
    ]);
    for (const r of radios) expect(r.querySelector("sup")).not.toBeNull();
    expect(radios[3]).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText((_, el) => el?.tagName === "P" && /^Best split for .*10 to the 23 FLOPs$/.test(el.textContent ?? ""))).toBeInTheDocument();
  });

  it("opens off the optimum, and dragging to the best size matches the best split", () => {
    render(<IsoComputeExplorer />);
    const best = optimumAt(1e23);
    const bestLoss = `loss ${best.loss.toFixed(3)}`;
    // Opens at 100B parameters, too big for this budget: worse than the best.
    expect(screen.getAllByText(/^loss /).map((e) => e.textContent)).not.toEqual([bestLoss, bestLoss]);
    fireEvent.change(screen.getByRole("slider"), { target: { value: String(Math.log10(best.N).toFixed(2)) } });
    const [yours, theBest] = screen.getAllByText(/^loss /).map((e) => Number(e.textContent!.slice(5)));
    expect(theBest).toBeCloseTo(best.loss, 3);
    expect(yours - theBest).toBeLessThan(0.002);
  });

  it("puts each budget in familiar terms: against Chinchilla's run, and in GPU time", () => {
    render(<IsoComputeExplorer />);
    const line = () => screen.getByText((_, el) => el?.tagName === "P" && /Chinchilla's training run/.test(el.textContent ?? "")).textContent;
    expect(line()).toMatch(/10 to the 23 FLOPs is about a sixth of Chinchilla's training run, or roughly 31 hours on 1,000 NVIDIA B200 GPUs\./);
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 20 FLOPs/ }));
    expect(line()).toMatch(/about 1\/6000 of Chinchilla's training run, or roughly 2 minutes/);
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 21 FLOPs/ }));
    expect(line()).toMatch(/about 1\/600 of Chinchilla's training run, or roughly 19 minutes/);
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 24 FLOPs/ }));
    expect(line()).toMatch(/about 1\.7 times Chinchilla's training run, or roughly 13 days/);
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 25 FLOPs/ }));
    expect(line()).toMatch(/about 17 times Chinchilla's training run, or roughly 129 days/);
  });

  it("a bigger budget moves the best split and lowers its loss", () => {
    render(<IsoComputeExplorer />);
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 24 FLOPs/ }));
    expect(screen.getByText((_, el) => el?.tagName === "P" && /^Best split for .*10 to the 24 FLOPs$/.test(el.textContent ?? ""))).toBeInTheDocument();
    // (At this budget the opening 100B model is itself close to the best size,
    // so both readouts may show the same loss.)
    expect(screen.getAllByText(`loss ${optimumAt(1e24).loss.toFixed(3)}`).length).toBeGreaterThan(0);
    expect(optimumAt(1e24).loss).toBeLessThan(optimumAt(1e23).loss);
    expect(screen.getByText(/Each step buys less\./)).toBeInTheDocument();
  });

  it("plots the best loss at each budget as a tiny line, lighting the chosen budget", () => {
    render(<IsoComputeExplorer />);
    const spark = screen.getByRole("img", { name: /^Best loss at 10 to the 20, .* FLOPs: / });
    const want = ISO_BUDGETS.map((c) => optimumAt(c).loss.toFixed(2));
    expect(spark).toHaveAccessibleName(`Best loss at ${ISO_BUDGETS.map((c) => `10 to the ${Math.log10(c)}`).join(", ")} FLOPs: ${want.join(", ")}.`);
    const dots = spark.querySelectorAll("circle");
    expect(dots).toHaveLength(ISO_BUDGETS.length);
    expect(dots[3]).toHaveClass("fill-compute-bright");
    fireEvent.click(screen.getByRole("radio", { name: /10 to the 20 FLOPs/ }));
    // The opening 100B model gets under one token per parameter at this budget.
    expect(screen.getByText(/100B parameters on 167M tokens, under 1 token per parameter/)).toBeInTheDocument();
    expect(spark.querySelectorAll("circle")[0]).toHaveClass("fill-compute-bright");
    expect(spark.querySelectorAll("circle")[3]).not.toHaveClass("fill-compute-bright");
  });
});
