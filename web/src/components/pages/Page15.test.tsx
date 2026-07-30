import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page15 } from "./Page15";

const pickCase = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("Page 15 (the scoreboard) component", () => {
  it("renders under its route-map title with the coordinate frame", () => {
    render(<Page15 />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /The Scoreboard: Benchmarks That Track Reasoning/,
    );
    expect(screen.getByText(/four coordinates/)).toBeInTheDocument();
    expect(screen.getByText(/not a property of a model/)).toBeInTheDocument();
  });

  it("opens on the o1 case: two quote-true headlines, page 13's numbers", () => {
    render(<Page15 />);
    expect(screen.getByRole("button", { name: "o1 on AIME 2024" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText(/“o1 scores 74\.4% on AIME 2024”/)).toBeInTheDocument();
    expect(screen.getByText(/“o1 scores 93% on AIME 2024”/)).toBeInTheDocument();
    expect(screen.getAllByText("quote-true")).toHaveLength(2);
    // Receipts stay hidden until the reader guesses or opts out.
    expect(screen.queryByText(/What moved:/)).not.toBeInTheDocument();
  });

  it("a right guess on the o1 case reveals the budget row and the lesson", () => {
    render(<Page15 />);
    fireEvent.click(screen.getByRole("button", { name: "the thinking budget" }));
    expect(screen.getByText(/Good guess\./)).toBeInTheDocument();
    expect(screen.getByText("the thinking budget, and nothing else")).toBeInTheDocument();
    expect(screen.getByText(/1,000 chains per problem/)).toBeInTheDocument();
    expect(screen.getByText(/18\.6 points of AIME live in the sampling dial alone/)).toBeInTheDocument();
  });

  it("a wrong guess is corrected without blocking the reveal", () => {
    render(<Page15 />);
    fireEvent.click(screen.getByRole("button", { name: "the model variant" }));
    expect(
      screen.getByText(/Not quite: the model variant is the same in both headlines/),
    ).toBeInTheDocument();
    expect(screen.getByText("the thinking budget, and nothing else")).toBeInTheDocument();
  });

  it("the GPT-4o case pins the harness gap: 12 vs 9.3 on the same model", () => {
    render(<Page15 />);
    pickCase(/^GPT-4o on AIME 2024$/);
    expect(screen.getByText(/“GPT-4o scores 12% on AIME 2024”/)).toBeInTheDocument();
    expect(screen.getByText(/“GPT-4o scores 9\.3% on AIME 2024”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "just show me" }));
    expect(screen.getByText("whose harness scored it, and nothing else")).toBeInTheDocument();
    expect(screen.getByText(/Compare scores only inside one report/)).toBeInTheDocument();
  });

  it("the FrontierMath case reveals that every coordinate moved at once", () => {
    render(<Page15 />);
    pickCase(/^o3 on FrontierMath$/);
    expect(screen.getByText(/“o3 scores 25\.2% on FrontierMath”/)).toBeInTheDocument();
    expect(screen.getByText(/“o3 scores 10% on FrontierMath”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "whose harness scored it" }));
    expect(screen.getByText("all four coordinates at once")).toBeInTheDocument();
    expect(screen.getByText(/180-problem 2024-11 version/)).toBeInTheDocument();
    expect(screen.getByText(/290-problem 2025-02 set/)).toBeInTheDocument();
    expect(screen.getByText(/funded the benchmark, disclosed late/)).toBeInTheDocument();
  });

  it("each case keeps its own reveal when the reader switches back", () => {
    render(<Page15 />);
    fireEvent.click(screen.getByRole("button", { name: "the thinking budget" }));
    pickCase(/^o3 on FrontierMath$/);
    expect(screen.queryByText(/What moved:/)).not.toBeInTheDocument();
    pickCase(/^o1 on AIME 2024$/);
    expect(screen.getByText("the thinking budget, and nothing else")).toBeInTheDocument();
  });

  it("the window simulation opens mid-ladder: one ceiling, two windows, one floor", () => {
    render(<Page15 />);
    expect(screen.getAllByText("no signal: everyone passes")).toHaveLength(1);
    expect(screen.getAllByText("signal: it separates the models")).toHaveLength(2);
    expect(screen.getAllByText("no signal: everyone fails")).toHaveLength(1);
    expect(screen.getByText(/Tests that can currently see the frontier/)).toBeInTheDocument();
    expect(screen.getByText("2 of 4")).toBeInTheDocument();
  });

  it("maxing the frontier blinds every test and calls for new goalposts", () => {
    render(<Page15 />);
    fireEvent.change(screen.getByRole("slider", { name: /frontier capability/ }), {
      target: { value: "12" },
    });
    expect(screen.getAllByText("no signal: everyone passes")).toHaveLength(4);
    expect(screen.getByText(/Every test here has gone blind/)).toBeInTheDocument();
    expect(screen.getByText(/moving the goalposts is the system working/)).toBeInTheDocument();
  });

  it("the figure makes no live status claims and discloses its authored shape", () => {
    render(<Page15 />);
    expect(screen.queryByText(/still standing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^standing/)).not.toBeInTheDocument();
    expect(screen.getByText(/difficulties and spreads are authored for teaching/)).toBeInTheDocument();
    // History appears only as immutable facts, FrontierMath only as its launch state.
    expect(screen.getByText(/FrontierMath\s+opened with every frontier model under 2%/)).toBeInTheDocument();
    expect(screen.getByText(/moving goalposts are the system working/)).toBeInTheDocument();
  });

  it("pins Minerva's named-knob exhibit: maj1@64 vs pass@1", () => {
    render(<Page15 />);
    expect(screen.getByText(/maj1@64 = 50\.3%/)).toBeInTheDocument();
    expect(screen.getByText(/pass@1 = 33\.6%/)).toBeInTheDocument();
  });

  it("hands off to page 16's bill through the one metered coordinate", () => {
    render(<Page15 />);
    expect(screen.getByText(/thinking is billed by the token\. Next: the bill/)).toBeInTheDocument();
  });

  it("defers ARC-AGI to the cost page instead of double-teaching it", () => {
    render(<Page15 />);
    expect(screen.queryByRole("button", { name: /ARC/ })).not.toBeInTheDocument();
    expect(screen.getByText(/ARC-AGI/)).toBeInTheDocument();
    expect(screen.getByText(/page 16 tells it with a dollar axis/)).toBeInTheDocument();
  });

  it("keeps the reference notes to bare cites, as pages 3-8 do", () => {
    render(<Page15 />);
    const note = screen.getByText("References").closest("aside")!;
    expect(note.textContent).toMatch(/Lewkowycz et al\. 2022/);
    expect(note.textContent).not.toMatch(/NeurIPS|arXiv|Table 3/);
  });

  it("links a citation stub for every source used", () => {
    render(<Page15 />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("https://openai.com/index/learning-to-reason-with-llms/");
    expect(links).toContain("https://arxiv.org/abs/2501.12948"); // DeepSeek-R1
    expect(links).toContain("https://arxiv.org/abs/2411.04872"); // FrontierMath
    expect(links).toContain("https://arxiv.org/abs/2110.14168"); // GSM8K
    expect(links).toContain("https://arxiv.org/abs/2103.03874"); // MATH
    expect(links).toContain("https://arxiv.org/abs/2311.12022"); // GPQA
    expect(links).toContain("https://arxiv.org/abs/2206.14858"); // Minerva
  });

  it("discloses that announcement figures are vendor-reported", () => {
    render(<Page15 />);
    expect(screen.getByText(/vendor-reported and not peer-reviewed/)).toBeInTheDocument();
  });
});
