import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page11 } from "./Page11";

const setSlider = (name: RegExp, value: number) =>
  fireEvent.change(screen.getByRole("slider", { name }), { target: { value } });
const clickBand = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("Page 11 (the test-time compute scaling law) component", () => {
  it("renders the keystone title and the two-currencies framing", () => {
    render(<Page11 />);
    expect(screen.getByText(/The Keystone: The Test-Time Compute Scaling Law/)).toBeInTheDocument();
    expect(screen.getByText(/two ways to spend the same FLOPs/i)).toBeInTheDocument();
    expect(screen.getByText(/can thinking harder out-buy a bigger model/i)).toBeInTheDocument();
  });

  /* ---- section 1, the measured game (B1: no crossing) ------------------- */

  it("opens on the hard band at 16 samples, the small model still under the 7B", () => {
    render(<Page11 />);
    expect(screen.getByRole("button", { name: /^hard$/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^easy$/i })).toHaveAttribute("aria-pressed", "false");
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/vote@16: 55%, still 5 points under the Qwen2\.5-7B[’']s 60%/);
    expect(status).toHaveTextContent(/6\.5× its bill/);
    expect(status).toHaveTextContent(/trained verifier \(page 8\) only ties it, at 60%/);
    expect(status).toHaveTextContent(/No sample budget on this band crosses the line/);
  });

  it("slides the marker down the vote curve to one sample", () => {
    render(<Page11 />);
    setSlider(/test-time compute/i, 0); // n = 1
    expect(screen.getByRole("status")).toHaveTextContent(/vote@1:/);
  });

  it("switches to the easy band and still shows no crossing", () => {
    render(<Page11 />);
    clickBand(/^easy$/i);
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/vote@16: 84%, still 4 points under the Qwen2\.5-7B[’']s 88%/);
    // the easy band has no trained verifier of its own, so no ties clause
    expect(status).not.toHaveTextContent(/trained verifier/);
  });

  it("teaches the mechanism (B2): the answer is in the pile, selection fails", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/the bottleneck is not the thinking,\s*it is the picking/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/the reasoning is there/i)).toBeInTheDocument();
    // the same phrase closes the hand-off, so both uses are expected
    expect(
      screen.getAllByText(/no rule we can run at answer time reliably grabs it/i).length,
    ).toBeGreaterThan(0);
    // coverage (78%) sits above the target the selector cannot reach
    expect(screen.getAllByText(/78%/).length).toBeGreaterThan(0);
  });

  it("lets the reader vote with the 1.5B, which stalls even lower", () => {
    render(<Page11 />);
    fireEvent.click(screen.getByRole("button", { name: /^1\.5B$/ }));
    // hard band, 1.5B vote@16 = 29%, 31 points under the 7B's 60%
    expect(screen.getByRole("status")).toHaveTextContent(
      /1\.5B vote@16: 29%, still 31 points under the Qwen2\.5-7B[’']s 60%/,
    );
    // the 1.5B is not the 3B, so its (nonexistent) verifier is not claimed
    expect(screen.getByRole("status")).not.toHaveTextContent(/trained verifier/);
  });

  it("adapts the mechanism when coverage itself falls short (1.5B on easy)", () => {
    render(<Page11 />);
    fireEvent.click(screen.getByRole("button", { name: /^easy$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^1\.5B$/ }));
    // easy-band 1.5B coverage (74%) is below the 7B's 88%, so it is not only selection
    expect(
      screen.getByText(/Scaling the parameters, not the samples, is what closes that gap/i),
    ).toBeInTheDocument();
  });

  it("prices the game in multiples of the big model's own bill", () => {
    render(<Page11 />);
    expect(screen.getByText(/single greedy\s*answer is the target/i)).toBeInTheDocument();
    expect(screen.getByText(/one times its own bill/i)).toBeInTheDocument();
  });

  it("labels section 1 as measured on this deck's instrument, not simulated", () => {
    render(<Page11 />);
    expect(screen.getByText(/measured, Qwen2\.5-3B against 7B/i)).toBeInTheDocument();
    expect(
      screen.getByText(/reproduces their shipped numbers\s*exactly before it draws anything new/i),
    ).toBeInTheDocument();
  });

  /* ---- section 2, the published law (kept, reframed as 2024) ------------ */

  it("frames section 2 as the published 2024 law", () => {
    render(<Page11 />);
    expect(screen.getByRole("heading", { name: /2\. The published law/ })).toBeInTheDocument();
    expect(screen.getByText(/That was our own instrument, in 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/from before the reasoning-training recipes/i)).toBeInTheDocument();
  });

  it("grounds the 4x claim in its baseline: flat 256 vs difficulty-first 64", () => {
    render(<Page11 />);
    expect(screen.getByText(/fewer samples than best-of-N/i)).toBeInTheDocument();
    expect(screen.getByText(/best-of-N spends 256 samples on every question/i)).toBeInTheDocument();
    expect(screen.getByText(/64 samples buy the same accuracy/i)).toBeInTheDocument();
  });

  it("states the R rule as amortization", () => {
    render(<Page11 />);
    expect(screen.getByText(/R = tokens you will serve ÷ tokens you trained on/i)).toBeInTheDocument();
    expect(screen.getByText(/serve billions \(R → ∞\) and parameters win/i)).toBeInTheDocument();
  });

  it("keeps the distribution intuition in the hard-mode box", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/only surface answers the model can\s*already produce/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/the distribution itself never moves/i)).toBeInTheDocument();
  });

  /* ---- sections 3 and 4, Wu receipts (kept as published) --------------- */

  it("plots the Wu et al. Pareto pair: same accuracy, 8x fewer FLOPs", () => {
    render(<Page11 />);
    expect(screen.getByText(/same accuracy · 8× fewer FLOPs/)).toBeInTheDocument();
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
  });

  it("shades the Pythia budget axis into one ownership band per scale", () => {
    render(<Page11 />);
    expect(screen.getAllByTestId("ownership-band")).toHaveLength(3);
    for (const label of ["410M leads", "2.8B leads", "12B leads"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("ties each model's sampling point to its REBASE point with a connector", () => {
    render(<Page11 />);
    expect(screen.getAllByTestId("pair-connector")).toHaveLength(3);
  });

  /* ---- provenance and the hand-off ------------------------------------- */

  it("hands off to Act 3 on the two loose ends: selection and waste", () => {
    render(<Page11 />);
    expect(screen.getByText(/So why did the crossing not appear for us/i)).toBeInTheDocument();
    expect(screen.getByText(/the law lives in a narrow window/i)).toBeInTheDocument();
    expect(screen.getByText(/The selection\s*wall/i)).toBeInTheDocument();
    expect(screen.getByText(/train the reasoning into the weights/i)).toBeInTheDocument();
    expect(screen.getByText(/pages 13 and 14 reward only correct answers/i)).toBeInTheDocument();
  });

  it("labels the footer Measured / Cited", () => {
    render(<Page11 />);
    expect(screen.getByText("Measured")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/instance on a 2026 instrument, not a refutation/i)).toBeInTheDocument();
  });

  it("offers the notebook + traces download at the top of the figure", () => {
    render(<Page11 />);
    expect(screen.getByText("Reproduce it")).toBeInTheDocument();
    const dl = screen.getByRole("link", { name: /Download the notebook and traces/i });
    expect(dl).toHaveAttribute("href", "/notebooks/page-11-training-vs-scale.zip");
    expect(dl).toHaveAttribute("download");
  });

  it("keeps all reference notes to bare cites, each beside its first use", () => {
    render(<Page11 />);
    const notes = screen.getAllByText("References").map((el) => el.closest("aside")!);
    expect(notes).toHaveLength(3);
    expect(notes[0].textContent).toMatch(/Snell et al\. 2024, Scaling LLM Test-Time Compute/);
    expect(notes[0].textContent).toMatch(/Brown et al\. 2024, Large Language Monkeys/);
    expect(notes[0].textContent).toMatch(/Shojaee et al\. 2025, The Illusion of Thinking/);
    expect(notes[1].textContent).toMatch(/Wu et al\. 2024, Inference Scaling Laws/);
    expect(notes[2].textContent).toMatch(/Stroebl et al\. 2024, Inference Scaling fLaws/);
    for (const note of notes) {
      expect(note.textContent).not.toMatch(/ICLR|NeurIPS|arXiv|Table 1/);
    }
  });

  it("links each reference to its paper, opening in a new tab", () => {
    render(<Page11 />);
    for (const [name, href] of [
      [/Snell et al\. 2024/, "https://arxiv.org/abs/2408.03314"],
      [/Brown et al\. 2024/, "https://arxiv.org/abs/2407.21787"],
      [/Shojaee et al\. 2025/, "https://arxiv.org/abs/2506.06941"],
      [/Wu et al\. 2024/, "https://arxiv.org/abs/2408.00724"],
      [/Stroebl et al\. 2024/, "https://arxiv.org/abs/2411.17501"],
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

  it("uses no em dashes or en dashes in the rendered copy", () => {
    render(<Page11 />);
    expect(document.body.textContent).not.toMatch(/[–—]/);
  });
  /* ---- section 3 Pythia detail + the FLOPs gloss, adopted from main --- */

  it("glosses FLOPs where the page first spends the word", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/floating-point\s+operations, the raw count of arithmetic a chip does/i),
    ).toBeInTheDocument();
  });

  it("stops the Pythia shading where the other models were not measured", () => {
    render(<Page11 />);
    // the 410M is alone below 8 and the 12B alone above 1000, and a leader
    // needs a rival, so the bands reach neither edge of the 1..4096 axis
    const bands = screen.getAllByTestId("ownership-band");
    const last = bands[bands.length - 1];
    const left = Number(bands[0].getAttribute("x"));
    const right = Number(last.getAttribute("x")) + Number(last.getAttribute("width"));
    expect(left).toBeGreaterThan(0);
    expect(right).toBeLessThan(496); // inner plot width: 560 less the margins
  });

  it("brackets each Pythia handover in a strip instead of ruling a crossing", () => {
    render(<Page11 />);
    const strips = screen.getAllByTestId("handover-strip");
    expect(strips).toHaveLength(2);
    // the 2.8B/12B pass is ~0.6 points, inside the ±3 the figure was read to,
    // for its whole width: the last strip must cover the entire 12B band
    const band = screen.getAllByTestId("ownership-band")[2];
    const strip = strips[1];
    const bandX = Number(band.getAttribute("x"));
    const stripX = Number(strip.getAttribute("x"));
    expect(stripX).toBeLessThanOrEqual(bandX);
    expect(stripX + Number(strip.getAttribute("width"))).toBeGreaterThanOrEqual(
      bandX + Number(band.getAttribute("width")),
    );
    expect(
      screen.getByText(/the crossing sits somewhere in the strip rather than on a\s+line/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not the budget at which the 12B takes over/i),
    ).toBeInTheDocument();
  });

  it("rank-matches the Pythia hues to section 1's family, smallest first", () => {
    render(<Page11 />);
    // Same colour, same rank in both charts: 1x/410M green, 2x/2.8B blue,
    // 4x/12B red. A different order makes the two figures contradict.
    const bands = screen.getAllByTestId("ownership-band");
    expect(bands[0]).toHaveClass("fill-correct-bright");
    expect(bands[1]).toHaveClass("fill-compute-bright");
    expect(bands[2]).toHaveClass("fill-wrong-bright");
  });

  it("scales the Pythia family by its real ratios, not fixed multiples", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/the 2\.8B is about 7× the 410M and the 12B about 29×/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/the colours carry rank, not fixed multiples/i)).toBeInTheDocument();
  });

});
