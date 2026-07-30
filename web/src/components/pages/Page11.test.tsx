import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page11 } from "./Page11";

const setSlider = (name: RegExp, value: number) =>
  fireEvent.change(screen.getByRole("slider", { name }), { target: { value } });

const clickDifficulty = (name: RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("Page 11 (the test-time compute scaling law) component", () => {
  it("renders the keystone title and states the two-currencies framing", () => {
    render(<Page11 />);
    expect(screen.getByText(/The Keystone: The Test-Time Compute Scaling Law/)).toBeInTheDocument();
    expect(screen.getByText(/two ways to spend the same FLOPs/i)).toBeInTheDocument();
  });

  it("opens on medium difficulty with one small-model answer, short of the target", () => {
    render(<Page11 />);
    expect(screen.getByRole("button", { name: /^medium$/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^hard$/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/30\.0% so far; the 14× model gets 62%/);
  });

  it("beats the 14x model on medium with 8 samples, for 1.8x less compute", () => {
    render(<Page11 />);
    setSlider(/test-time compute/i, 3); // 2^3 = 8 samples, 8 FLOPs units
    expect(screen.getByRole("status")).toHaveTextContent(
      /✓ matched the 14× model's 62%, for 1\.8× less compute/,
    );
  });

  it("stops one notch earlier, at 4 samples, still short of the target", () => {
    render(<Page11 />);
    setSlider(/test-time compute/i, 2);
    expect(screen.getByRole("status")).toHaveTextContent(/so far; the 14× model gets 62%/);
  });

  it("on hard, reports saturation below the target and points back to pretraining", () => {
    render(<Page11 />);
    clickDifficulty(/^hard$/i);
    setSlider(/test-time compute/i, 8); // even 256 samples cannot reach it
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/✗ this model saturates near 14%; the target is out of reach/);
    expect(status).toHaveTextContent(/pretraining the larger model is the better buy/i);
  });

  it("turning the model knob to 14x reproduces the target at the same price", () => {
    render(<Page11 />);
    setSlider(/model size/i, 3); // 14x model, 1 sample = 14 units
    expect(screen.getByRole("status")).toHaveTextContent(
      /matched it, but you spent 14 units and the 14× model needs only 14/,
    );
  });

  it("plots the Wu et al. Pareto pair: same accuracy, 8x fewer FLOPs", () => {
    render(<Page11 />);
    expect(screen.getByText(/same accuracy · 8× fewer FLOPs/)).toBeInTheDocument();
    expect(screen.getAllByText("Llemma-7B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Llemma-34B").length).toBeGreaterThan(0);
    expect(screen.getByText(/edges the 34B model[’']s best sampling run/i)).toBeInTheDocument();
  });

  it("splits the field data into two claims: budget bands, then better search", () => {
    render(<Page11 />);
    expect(
      screen.getByRole("heading", { name: /3\. Each scale owns a band of the budget/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /4\. Better search moves the whole frontier/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/this one varies how it is/i)).toBeInTheDocument();
  });

  it("ties each model's sampling point to its REBASE point with a connector", () => {
    render(<Page11 />);
    expect(screen.getAllByTestId("pair-connector")).toHaveLength(3);
  });

  it("shades the Pythia budget axis into one ownership band per scale", () => {
    render(<Page11 />);
    expect(screen.getAllByTestId("ownership-band")).toHaveLength(3);
    for (const label of ["410M leads", "2.8B leads", "12B leads"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("scopes the Snell cite beside the chart: claims cited, coordinates illustrative", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/crossings and ceilings are Snell et\s+al\.[’']s claims/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/exact coordinates are illustrative/i)).toBeInTheDocument();
  });

  it("hands off to page 12 below section 4: train on the reasoning search found", () => {
    render(<Page11 />);
    expect(screen.getByText(/teaching the model to\s+reason/i)).toBeInTheDocument();
    expect(screen.getByText(/thrown away the moment the answer\s+is scored/i)).toBeInTheDocument();
  });

  it("carries the saturation caveat: no oracle verifier, no 100%", () => {
    render(<Page11 />);
    expect(screen.getByText(/sampling alone never reaches 100%/i)).toBeInTheDocument();
  });

  it("defines what 14x actually multiplies: the base model's parameter count", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/14× means 14× the base model[’']s parameter count/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/report model scale only as a multiple/i)).toBeInTheDocument();
  });

  it("draws the whole curve family at once and only moves the marker", () => {
    render(<Page11 />);
    // every size's end-of-curve label is present without touching a knob
    for (const label of ["1×", "2×", "4×"]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/the knobs never move them/i)).toBeInTheDocument();
    expect(screen.getByText("14× · 1 answer")).toBeInTheDocument();
  });

  it("attaches a unit to the 4x claim: samples, 64 doing the work of 256", () => {
    render(<Page11 />);
    expect(screen.getByText(/fewer samples than best-of-N/i)).toBeInTheDocument();
    expect(screen.getByText(/64 samples doing the work of 256/i)).toBeInTheDocument();
  });

  it("states the R rule as its two limits", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/R = inference tokens served ÷ pretraining tokens/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/As R → 0, thinking wins/i)).toBeInTheDocument();
    expect(screen.getByText(/As R → ∞, parameters win/i)).toBeInTheDocument();
  });

  it("grounds real parameter counts in the Pythia chart, not the game", () => {
    render(<Page11 />);
    expect(screen.getAllByText("410M").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2.8B").length).toBeGreaterThan(0);
    expect(screen.getAllByText("12B").length).toBeGreaterThan(0);
    expect(screen.getByText(/410M model is the\s+compute-optimal pick/i)).toBeInTheDocument();
    expect(screen.getByText(/read off the paper[’']s figure by eye/i)).toBeInTheDocument();
  });

  it("leads the REBASE caption with the paper-level half-the-FLOPs finding", () => {
    render(<Page11 />);
    expect(screen.getByText(/about half the total FLOPs/i)).toBeInTheDocument();
  });

  it("keeps both reference notes to bare cites, as pages 3-10 do", () => {
    render(<Page11 />);
    const notes = screen.getAllByText("References").map((el) => el.closest("aside")!);
    expect(notes).toHaveLength(2);
    expect(notes[0].textContent).toMatch(/Snell et al\. 2024, Scaling LLM Test-Time Compute/);
    expect(notes[1].textContent).toMatch(/Wu et al\. 2024, Inference Scaling Laws/);
    for (const note of notes) {
      expect(note.textContent).not.toMatch(/ICLR|NeurIPS|arXiv|Table 1/);
    }
  });

  it("links each reference to its paper, opening in a new tab", () => {
    render(<Page11 />);
    // References live in the margin notes only, so each work is linked once.
    for (const [name, href] of [
      [/Snell et al\. 2024/, "https://arxiv.org/abs/2408.03314"],
      [/Wu et al\. 2024/, "https://arxiv.org/abs/2408.00724"],
    ] as const) {
      const links = screen.getAllByRole("link", { name });
      expect(links.length).toBeGreaterThanOrEqual(1);
      for (const a of links) {
        expect(a).toHaveAttribute("href", href);
        expect(a).toHaveAttribute("target", "_blank");
        expect(a).toHaveAttribute("rel", "noopener noreferrer");
      }
    }
  });

  it("discloses simulated vs cited in the two-label footer, page-12 style", () => {
    render(<Page11 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(
      screen.getByText(/authored illustrations pinned to the cited findings/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/transcribed exactly from the same paper[’']s MATH500 results table/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/read off Wu et\s+al\.[’']s GSM8K figure by eye/i)).toBeInTheDocument();
  });

  it("keeps each chart's fidelity caveat directly under that chart", () => {
    render(<Page11 />);
    expect(screen.getByText(/read off the paper[’']s figure by eye \(±3 points\)/i)).toBeInTheDocument();
    expect(screen.getByText(/exact values from the paper[’']s MATH500 results table/i)).toBeInTheDocument();
  });

  it("opens the game with the unit, the dot's price, and the win condition", () => {
    render(<Page11 />);
    expect(screen.getByText(/One unit is one answer from the 1× model/i)).toBeInTheDocument();
    expect(screen.getByText(/Model size picks your curve; test-time compute slides/i)).toBeInTheDocument();
  });
});
