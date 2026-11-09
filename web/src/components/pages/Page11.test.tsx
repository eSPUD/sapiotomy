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

  it("slides the marker back to the model's own greedy answer, the fork", () => {
    render(<Page11 />);
    setSlider(/test-time compute/i, 0); // rung 0: one answer, greedy
    expect(screen.getByRole("status")).toHaveTextContent(
      /3B greedy: 43%, still 17 points under the Qwen2\.5-7B[’']s 60%/,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/0\.5× its bill/);
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

  it("makes the coverage-selection gap explicit, not a mystery line", () => {
    render(<Page11 />);
    expect(screen.getByText("found, not selected")).toBeInTheDocument();
    // one riser per sample budget that has a gap (n = 1 has none), plus the
    // counted bracket on the widest
    expect(screen.getAllByTestId("gap-riser")).toHaveLength(4);
    expect(screen.getByText("23 points")).toBeInTheDocument();
    expect(screen.getByText(/the green risers are what the vote throws away/i)).toBeInTheDocument();
  });

  it("starts the vote road ON the small model's greedy dot, never past it", () => {
    render(<Page11 />);
    expect(screen.getByText(/Both roads leave the same dot/i)).toBeInTheDocument();
    // the ring marks the fork; the road's first vertex must be that exact point,
    // not a sampled n = 1 draw that sits beside it and doubles the curve back
    for (const band of [/^hard$/i, /^easy$/i]) {
      for (const m of [/^3B$/, /^1\.5B$/]) {
        clickBand(band);
        fireEvent.click(screen.getByRole("button", { name: m }));
        const ring = screen.getByTestId("branch-point");
        const road = screen.getByTestId("vote-road").getAttribute("d")!;
        expect(road.startsWith(`M${ring.getAttribute("cx")},${ring.getAttribute("cy")}`)).toBe(true);
        // and every rung after it costs strictly more, so the road only goes right
        const xs = [...road.matchAll(/[ML]([\d.]+),/g)].map((mm) => Number(mm[1]));
        expect(xs).toEqual([...xs].sort((a, b) => a - b));
        expect(new Set(xs).size).toBe(xs.length);
      }
    }
  });

  it("prices the game in multiples of the big model's own bill", () => {
    render(<Page11 />);
    expect(screen.getByText(/single greedy answer\s*sets the bar/i)).toBeInTheDocument();
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
    expect(screen.getByText(/That was one model family, on one date/i)).toBeInTheDocument();
    expect(screen.getByText(/says the opposite is\s*possible/i)).toBeInTheDocument();
    expect(
      screen.getByText(/on models from before the reasoning recipes/i),
    ).toBeInTheDocument();
  });

  it("lifts each section's lede out of its card, into the page's whitespace", () => {
    render(<Page11 />);
    // pages 5 to 9's shape: the sentence saying what the figure is a picture OF
    // sits on the page background; the bordered card holds only the figure.
    for (const lede of [
      /Both roads leave the same dot/i,
      /That was one model family, on one date/i,
      /The law is not only Snell/i,
      /Section 3 varied how/i,
    ]) {
      const el = screen.getByText(lede);
      expect(el.closest("figure")).toBeNull();
      expect(el.closest(".bg-surface")).toBeNull();
    }
    // and every figure heading carries its own kicker in the whitespace above
    for (const kicker of [
      /measured, Qwen2\.5-3B against 7B/i,
      /Snell et al\. 2024, on models from before the reasoning recipes/i,
      /Wu et al\. 2024, Pythia 410M, 2\.8B and 12B on GSM8K/i,
      /MATH500 table, sampling against tree search/i,
    ]) {
      expect(screen.getByText(kicker)).toBeInTheDocument();
    }
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

  it("states the hard-mode boundary in plain words, with no unglossed jargon", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/only ever surface an answer the model was\s*already capable of writing/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a thousand tries are a thousand copies of the same wrong\s*idea/i),
    ).toBeInTheDocument();
    // "the distribution" was never defined on this page, so it is not spent here
    expect(document.body.textContent).not.toMatch(/the distribution/i);
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
    expect(screen.getByText(/The law lives in a narrow window/i)).toBeInTheDocument();
    expect(screen.getByText(/The selection wall/i)).toBeInTheDocument();
    expect(screen.getByText(/trains the reasoning into the weights/i)).toBeInTheDocument();
    expect(screen.getByText(/page 13 rewards\s*only correct answers/i)).toBeInTheDocument();
  });

  it("retires the Measured / Cited footer, keeping the apparatus beside its figures", () => {
    render(<Page11 />);
    expect(screen.queryByText("Measured")).not.toBeInTheDocument();
    expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    // the per-figure fine print stays where the claim is
    expect(screen.getByText(/read off the paper[’']s figure by eye/i)).toBeInTheDocument();
    expect(screen.getByText(/no digitization\s*involved/i)).toBeInTheDocument();
  });

  it("puts the notebook download on the top line, as on page 5", () => {
    render(<Page11 />);
    const dl = screen.getByRole("link", { name: /Download the notebook and traces/i });
    expect(dl).toHaveAttribute("href", "/notebooks/page-11-training-vs-scale.zip");
    expect(dl).toHaveAttribute("download");
    expect(dl).toHaveTextContent(/zip, 2\.8 MB/);
    expect(screen.queryByText("Reproduce it")).not.toBeInTheDocument();
  });

  it("keeps all reference notes to bare cites, each beside its first use", () => {
    render(<Page11 />);
    const notes = screen.getAllByText("References").map((el) => el.closest("aside")!);
    expect(notes).toHaveLength(3);
    expect(notes[0].textContent).toMatch(/Snell et al\. 2024, Scaling LLM Test-Time Compute/);
    expect(notes[0].textContent).toMatch(/Brown et al\. 2024, Large Language Monkeys/);
    expect(notes[0].textContent).not.toMatch(/Shojaee/);
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

  it("draws a bold lead segment for each scale that owns a band", () => {
    render(<Page11 />);
    // ownership is carried by the bold curve segments now, not a background wash
    expect(screen.getAllByTestId("lead-segment")).toHaveLength(3);
  });

  it("brackets each Pythia handover instead of ruling a crossing", () => {
    render(<Page11 />);
    expect(screen.getAllByTestId("handover-strip")).toHaveLength(2);
    // Matched on the claim rather than on one phrasing: this sentence was split in
    // two on 2026-08-10 for length, and the assertion should survive rewording
    // while still failing if the bracketing claim itself is dropped.
    const bracket = screen.getByText(/the crossing sits somewhere inside the bar/i);
    expect(bracket).toBeInTheDocument();
    expect(bracket.textContent).toMatch(/not on the edge/i);
    // The hedge that licenses the bracketing: the bars are as wide as the read-off
    // tolerance. Without it "somewhere inside the bar" is an assertion, not a result.
    expect(bracket.textContent).toMatch(/±3 points this figure was read to/i);
    expect(
      screen.getByText(/not the budget at which the 12B takes over/i),
    ).toBeInTheDocument();
  });

  it("washes one coloured band per Pythia scale, smallest-green to largest-red", () => {
    render(<Page11 />);
    const washes = screen.getAllByTestId("ownership-wash");
    expect(washes).toHaveLength(3);
    expect(washes[0]).toHaveClass("fill-correct-bright");
    expect(washes[1]).toHaveClass("fill-compute-bright");
    expect(washes[2]).toHaveClass("fill-wrong-bright");
    // the washes tile the compared range: each starts where the last one ended
    const edge = (el: Element, a: "x" | "width") => Number(el.getAttribute(a));
    for (let i = 1; i < washes.length; i++) {
      expect(edge(washes[i], "x")).toBeCloseTo(edge(washes[i - 1], "x") + edge(washes[i - 1], "width"), 1);
    }
  });

  // Drawn only over the budgets where two models were measured, the washes left
  // 42% of the plot bare and made the two end bands the shortest on the page —
  // the 12B's was 8% of the width, which reads as "the biggest model barely wins
  // anywhere" rather than "it owns the dear end".
  it("tiles the whole budget axis with the washes, edge to edge", () => {
    render(<Page11 />);
    const washes = screen.getAllByTestId("ownership-wash");
    const plot = washes[0].closest("svg")!.querySelector("rect.fill-surface")!;
    const innerW = Number(plot.getAttribute("width"));
    expect(Number(washes[0].getAttribute("x"))).toBeCloseTo(0, 1);
    const last = washes[washes.length - 1];
    expect(Number(last.getAttribute("x")) + Number(last.getAttribute("width"))).toBeCloseTo(innerW, 1);
  });

  // What the extension must not do is claim a measurement that was not made.
  it("keeps each rail inside its wash, and narrower than it on the two end bands", () => {
    render(<Page11 />);
    const washes = screen.getAllByTestId("ownership-wash");
    const rails = screen.getAllByTestId("ownership-rail");
    expect(rails).toHaveLength(3);
    const span = (el: Element) => [
      Number(el.getAttribute("x")),
      Number(el.getAttribute("x")) + Number(el.getAttribute("width")),
    ];
    rails.forEach((rail, i) => {
      const [r0, r1] = span(rail);
      const [w0, w1] = span(washes[i]);
      expect(r0).toBeGreaterThanOrEqual(w0 - 0.5);
      expect(r1).toBeLessThanOrEqual(w1 + 0.5);
    });
    // the first band's wash runs left of its rail and the last band's runs right
    // of its: those are the stretches with no rival left on the grid
    expect(span(washes[0])[0]).toBeLessThan(span(rails[0])[0]);
    expect(span(washes[2])[1]).toBeGreaterThan(span(rails[2])[1]);
    // the middle band was compared end to end, so its rail spans its wash
    expect(span(rails[1])[0]).toBeCloseTo(span(washes[1])[0], 1);
    expect(span(rails[1])[1]).toBeCloseTo(span(washes[1])[1], 1);
    // and the figure says which mark carries the measurement
    expect(
      screen.getByText(/only the rail on top of each band was measured against a rival/i),
    ).toBeInTheDocument();
  });

  it("keeps every Pythia band label inside the band it names", () => {
    render(<Page11 />);
    const washes = screen.getAllByTestId("ownership-wash");
    const labels = screen.getAllByTestId("ownership-band");
    expect(labels).toHaveLength(3);
    labels.forEach((label, i) => {
      const cx = Number(label.getAttribute("x"));
      const x0 = Number(washes[i].getAttribute("x"));
      // never spills left into the neighbour's wash, which would claim the
      // wrong stretch of the axis
      expect(cx - (label.textContent!.length * 5.8) / 2).toBeGreaterThanOrEqual(x0 - 0.5);
    });
  });

  it("keeps the handover bars out of the band labels' row", () => {
    render(<Page11 />);
    // the bug this replaced: a full-height dashed rule cut through "410M leads".
    // The bars live in their own strip, so no bar shares a row with a label.
    const labelY = Number(screen.getAllByTestId("ownership-band")[0].getAttribute("y"));
    for (const strip of screen.getAllByTestId("handover-strip")) {
      for (const line of strip.querySelectorAll("line")) {
        const ys = [Number(line.getAttribute("y1")), Number(line.getAttribute("y2"))];
        expect(Math.min(...ys)).toBeGreaterThan(labelY);
      }
    }
  });

  it("centres each handover bar on the band edge it brackets", () => {
    render(<Page11 />);
    const washes = screen.getAllByTestId("ownership-wash");
    const edges = washes.slice(1).map((w) => Number(w.getAttribute("x")));
    screen.getAllByTestId("handover-strip").forEach((strip, i) => {
      const bar = strip.querySelector("line")!;
      const [x0, x1] = [Number(bar.getAttribute("x1")), Number(bar.getAttribute("x2"))];
      // the crossing the bar brackets is the wash edge, and it is inside the bar
      expect(edges[i]).toBeGreaterThanOrEqual(x0);
      expect(edges[i]).toBeLessThanOrEqual(x1);
      expect(Number(strip.querySelector("circle")!.getAttribute("cx"))).toBeCloseTo(edges[i], 1);
    });
  });

  it("colours the Pythia lead segments smallest-green to largest-red", () => {
    render(<Page11 />);
    // the bold segments run in budget order, 410M then 2.8B then 12B
    const leads = screen.getAllByTestId("lead-segment");
    expect(leads[0]).toHaveClass("stroke-correct-bright");
    expect(leads[1]).toHaveClass("stroke-compute-bright");
    expect(leads[2]).toHaveClass("stroke-wrong-bright");
  });

  it("scales the Pythia family by its real ratios, not fixed multiples", () => {
    render(<Page11 />);
    expect(
      screen.getByText(/the 2\.8B about 7× the 410M and the 12B about 29×/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/the colours carry rank, not fixed multiples/i)).toBeInTheDocument();
  });

});
