import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page15 } from "./Page15";

const pickBenchmark = (name: RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

describe("Page 15 (the scoreboard) component", () => {
  it("renders the Act-3 opener under its route-map title", () => {
    render(<Page15 />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /The Scoreboard: Benchmarks That Track Reasoning/,
    );
    expect(screen.getByText(/shelf life/)).toBeInTheDocument();
  });

  it("opens on GSM8K with the latest dot's receipt (Claude 3 Opus, 95%)", () => {
    render(<Page15 />);
    expect(screen.getByRole("button", { name: "GSM8K" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Claude 3 Opus")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText(/reported in: Anthropic 2024/)).toBeInTheDocument();
  });

  it("selecting a dot swaps in its source and its asterisk", () => {
    render(<Page15 />);
    fireEvent.click(
      screen.getByRole("button", { name: /PaLM 540B, chain of thought, .*: 56\.9%/ }),
    );
    expect(screen.getByText(/reported in: Wei et al\. 2022/)).toBeInTheDocument();
    expect(screen.getByText(/✱ same model, asked to show its work/)).toBeInTheDocument();
  });

  it("AIME carries the compute-settings asterisk: one model, three headlines", () => {
    render(<Page15 />);
    pickBenchmark(/^AIME 2024$/);
    fireEvent.click(screen.getByRole("button", { name: /o1, one sample, Sep 2024: 74%/ }));
    expect(screen.getByText(/83% with 64-sample voting, 93% re-ranking 1,000 samples/)).toBeInTheDocument();
  });

  it("FrontierMath shows both sides of the dispute as selectable dots", () => {
    render(<Page15 />);
    pickBenchmark(/^FrontierMath$/);
    expect(screen.getByRole("button", { name: /o3 — OpenAI, internal, Dec 2024: 25\.2%/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Epoch AI eval, Apr 2025: 10%/ }));
    expect(screen.getByText(/290-problem 2025-02 set/)).toBeInTheDocument();
  });

  it("Codeforces reads in Elo, not percent", () => {
    render(<Page15 />);
    pickBenchmark(/^Codeforces$/);
    expect(screen.getByText("2,029 Elo")).toBeInTheDocument(); // latest dot: DeepSeek-R1
    fireEvent.click(screen.getByRole("button", { name: /o3, Dec 2024: 2,727 Elo/ }));
    expect(screen.getByText("2,727 Elo")).toBeInTheDocument();
  });

  it("the treadmill names the criterion and marks FrontierMath as standing", () => {
    render(<Page15 />);
    expect(screen.getByText(/moving goalposts are the system working/)).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /MATH.*introduced Mar 2021.*stood 3\.\d years/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /FrontierMath: introduced Nov 2024, still standing/ })).toBeInTheDocument();
  });

  it("defers ARC-AGI to the cost page instead of double-teaching it", () => {
    render(<Page15 />);
    expect(screen.queryByRole("button", { name: /ARC/ })).not.toBeInTheDocument();
    expect(screen.getByText(/ARC-AGI/)).toBeInTheDocument();
    expect(screen.getByText(/page 17/)).toBeInTheDocument();
  });

  it("keeps the reference notes to bare cites, as pages 3-8 do", () => {
    render(<Page15 />);
    const note = screen.getByText("References").closest("aside")!;
    expect(note.textContent).toMatch(/Hendrycks et al\. 2021/);
    expect(note.textContent).not.toMatch(/NeurIPS|arXiv|Table 4/);
  });

  it("links a citation stub for every benchmark at the bottom", () => {
    render(<Page15 />);
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toContain("https://arxiv.org/abs/2110.14168"); // GSM8K
    expect(links).toContain("https://arxiv.org/abs/2103.03874"); // MATH
    expect(links).toContain("https://arxiv.org/abs/2311.12022"); // GPQA
    expect(links).toContain("https://arxiv.org/abs/2310.06770"); // SWE-bench
    expect(links).toContain("https://arxiv.org/abs/2411.04872"); // FrontierMath
  });

  it("discloses that announcement figures are vendor-reported", () => {
    render(<Page15 />);
    expect(screen.getByText(/vendor-reported and not peer-reviewed/)).toBeInTheDocument();
  });
});
