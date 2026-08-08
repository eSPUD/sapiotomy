import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page16 } from "./Page16";

const setSlider = (name: RegExp, value: number) =>
  fireEvent.change(screen.getByRole("slider", { name }), {
    target: { value: String(value) },
  });

describe("Page 16 (the bill comes due) component", () => {
  it("anchors the o3 bill: both configs, the 172x multiplier, human floor", () => {
    render(<Page16 />);
    expect(screen.getByText("75.7%")).toBeInTheDocument();
    expect(screen.getByText("87.5%")).toBeInTheDocument();
    expect(screen.getAllByText(/172× the compute/).length).toBeGreaterThan(0);
    expect(screen.getByText(/per task measured · \$2–5 plausible floor/)).toBeInTheDocument();
  });

  it("says the dollar figures are estimates and names the stable facts", () => {
    render(<Page16 />);
    expect(screen.getByText(/estimate-dependent/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI never published o3 pricing/)).toBeInTheDocument();
  });

  it("shows the ~27x price collapse from o1 to R1", () => {
    render(<Page16 />);
    expect(screen.getAllByText(/27\.4×/).length).toBeGreaterThan(0);
    expect(screen.getByText("$60/M")).toBeInTheDocument();
    expect(screen.getByText("$2.19/M")).toBeInTheDocument();
  });

  it("opens in the sampling regime: small model x10 undercuts the big call", () => {
    render(<Page16 />);
    expect(screen.getByText(/cheapest here: sample the small model/)).toBeInTheDocument();
    expect(screen.getByText(/10 samples per query/)).toBeInTheDocument();
  });

  it("raising the target past parity hands the win to the big model", () => {
    render(<Page16 />);
    setSlider(/target accuracy/i, 84);
    expect(screen.getByText(/cheapest here: one big-model call/)).toBeInTheDocument();
    expect(screen.getByText(/log-linear tax has eaten the whole 27\.4× price gap/)).toBeInTheDocument();
  });

  it("a target past the verifier ceiling shuts sampling off entirely", () => {
    render(<Page16 />);
    setSlider(/target accuracy/i, 92);
    expect(screen.getByText(/no number of samples reaches 92%/)).toBeInTheDocument();
    expect(screen.getByText(/sits past the verifier's ceiling \(90%\)/)).toBeInTheDocument();
  });

  it("enough volume makes distillation cheapest, with the crossover stated", () => {
    render(<Page16 />);
    setSlider(/queries you expect/i, 70);
    expect(screen.getByText(/cheapest here: distill once, then serve/)).toBeInTheDocument();
    expect(screen.getAllByText(/1\.5M/).length).toBeGreaterThan(0);
  });

  it("discloses the calculator's authored parameters in the step body", () => {
    render(<Page16 />);
    expect(screen.getByText(/Illustrative calculator, not a quote/)).toBeInTheDocument();
    expect(screen.getByText(/reported \$294k RL-stage cost/)).toBeInTheDocument();
  });

  it("keeps margin notes to bare cites, as pages 3-10 do", () => {
    const { container } = render(<Page16 />);
    const asides = container.querySelectorAll("aside");
    expect(asides.length).toBe(4);
    for (const aside of asides) {
      expect(aside.textContent).not.toMatch(/arXiv|ICLR|NeurIPS|Nature|http/);
    }
    expect(screen.getAllByText(/Bender et al\. 2025/).length).toBeGreaterThan(0);
  });

  it("carries linked citation stubs at the bottom", () => {
    const { container } = render(<Page16 />);
    expect(container.querySelector('a[href*="arcprize.org"]')).toBeTruthy();
    expect(container.querySelector('a[href*="api-docs.deepseek.com"]')).toBeTruthy();
    expect(container.querySelectorAll('a[href*="arxiv.org"]').length).toBeGreaterThanOrEqual(4);
  });
});
