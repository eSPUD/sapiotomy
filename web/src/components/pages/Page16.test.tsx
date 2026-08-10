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
    expect(screen.getByText(/per task measured · \$2 to \$5 plausible floor/)).toBeInTheDocument();
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
    expect(screen.getByText(/cheapest here.*distill once, then serve/)).toBeInTheDocument();
    expect(screen.getAllByText(/1\.5M/).length).toBeGreaterThan(0);
  });

  it("never recommends distilling without saying the retrain is assumed to land", () => {
    render(<Page16 />);
    setSlider(/queries you expect/i, 70);
    // The rent and sample arms both answer "at this target"; this one cannot,
    // because nothing cited fixes what a $294k retrain reaches. Printed flat
    // next to a target the page has just called unreachable, it reads as a
    // promise that the money buys any accuracy you type in.
    expect(screen.getByText(/IF the retrain reaches 72%/)).toBeInTheDocument();
    setSlider(/target accuracy/i, 92);
    expect(screen.getByText(/IF the retrain reaches 92%/)).toBeInTheDocument();
    expect(
      screen.getByText(/92% is past the point where sampling can get there at all/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/the distilled model is assumed to hit whatever target you set/),
    ).toBeInTheDocument();
  });

  it("states the serial-sampling assumption its latency claim rests on", () => {
    render(<Page16 />);
    // Page 19's panel prints the opposite for the same lever, and both are true
    // under assumptions neither page used to state.
    expect(screen.getByText(/as if they were drawn one after/i)).toBeInTheDocument();
    expect(screen.getByText(/the dollars still climb while the wait does not/i)).toBeInTheDocument();
  });

  it("hands a live question forward to 17, as page 15 does to this page", () => {
    render(<Page16 />);
    expect(
      screen.getByText(/the side of the dial where spending more makes the answer worse/i),
    ).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    const { container } = render(<Page16 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
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

  it("gives every numbered cite on the page a reference entry", () => {
    render(<Page16 />);
    // Cite renders an anchor to #ref-N and RefItem carries that id, so a cite
    // with no entry is a link that jumps nowhere.
    const dangling = Array.from(document.querySelectorAll('a[href^="#ref-"]'))
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id));
    expect(dangling).toEqual([]);
  });
});
