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
    // Two badges on the headlines, plus the inline gloss that defines the term.
    expect(screen.getAllByText("quote-true")).toHaveLength(3);
    // Receipts stay hidden until the reader guesses or opts out.
    expect(screen.queryByText(/What moved:/)).not.toBeInTheDocument();
  });

  it("a right guess on the o1 case reveals the budget row and the lesson", () => {
    render(<Page15 />);
    fireEvent.click(screen.getByRole("button", { name: "the thinking budget" }));
    expect(screen.getByText(/Good guess\./)).toBeInTheDocument();
    expect(screen.getByText("the thinking budget, as far as either report says")).toBeInTheDocument();
    expect(screen.getByText(/1,000 chains per problem/)).toBeInTheDocument();
    expect(screen.getByText(/18\.6 points of AIME live in the sampling dial alone/)).toBeInTheDocument();
  });

  it("a wrong guess is corrected without blocking the reveal", () => {
    render(<Page15 />);
    fireEvent.click(screen.getByRole("button", { name: "the model variant" }));
    expect(
      screen.getByText(/Not quite: the model variant is the same in both headlines/),
    ).toBeInTheDocument();
    expect(screen.getByText("the thinking budget, as far as either report says")).toBeInTheDocument();
  });

  it("the GPT-4o case pins the harness gap: 12 vs 9.3 on the same model", () => {
    render(<Page15 />);
    pickCase(/^GPT-4o on AIME 2024$/);
    expect(screen.getByText(/“GPT-4o scores 12% on AIME 2024”/)).toBeInTheDocument();
    expect(screen.getByText(/“GPT-4o scores 9\.3% on AIME 2024”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "just show me" }));
    expect(screen.getByText("whose harness scored it, as far as either report says")).toBeInTheDocument();
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
    expect(screen.getByText("the thinking budget, as far as either report says")).toBeInTheDocument();
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
    // The close is now five questions, not four: the fifth asks whether the
    // instrument could see at all, and the handoff runs through section 3's
    // measurement rather than through an assertion about billing.
    expect(screen.getByText(/ask five questions/)).toBeInTheDocument();
    expect(
      screen.getByText(/was this test published before the model trained/),
    ).toBeInTheDocument();
    expect(screen.getByText(/section 3 just watched it climb/)).toBeInTheDocument();
    expect(screen.getByText(/Next: the bill/)).toBeInTheDocument();
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

  it("claims only the numbers as the reports', not the headline sentences", () => {
    render(<Page15 />);
    // Every headline is a template string this page composes, so "both
    // headlines are lifted from the cited reports" sent a reader looking for
    // six sentences that were never published. The page footnote always had
    // the right scope; the body now matches it and defines the badge.
    expect(document.body.textContent).not.toMatch(/headlines are lifted from the cited reports/i);
    expect(
      screen.getByText(/every number in them is lifted verbatim from the cited/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/The sentence around the number is ours/i)).toBeInTheDocument();
  });

  it("points at the pages that actually spend the scoreboard, none past 19", () => {
    render(<Page15 />);
    // Read "pages 16 to 20" and a reader hits The End at 19 and assumes the
    // deck failed to load; 18 and 19 also stage no fight to judge.
    expect(document.body.textContent).not.toMatch(/pages 16 to 20/i);
    // "17 shows you where they came from" described no page: 17 is When
    // Reasoning Breaks. The pointer now names what page 17 actually does.
    expect(document.body.textContent).not.toMatch(/17 shows you where they came from/i);
    expect(screen.getByText(/17 shows you where more thinking backfires/i)).toBeInTheDocument();
  });

  it("gives the capability axis an anchor that cannot rot", () => {
    render(<Page15 />);
    expect(screen.getByRole("slider", { name: /ordinal, not calibrated to any date/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/Today is always wherever the newest test/i)).toBeInTheDocument();
  });

  it("names familiarity as the window's third closer and applies it to our own run", () => {
    render(<Page15 />);
    const closer = screen.getByText(/The third closer: familiarity/i).closest("p")!;
    // The slider shows two closers; this is the one that is not on its axis.
    expect(screen.getByText(/A window shuts three ways/i)).toBeInTheDocument();
    expect(closer.textContent).toMatch(/scoring recall rather than reasoning/);
    expect(closer.textContent).toMatch(/Page 17 puts a number on it/);
    // The caveat has to reach our own instrument or the page is exempting
    // itself from the thing it just taught: MATH-500's problems are from 2021.
    expect(closer.textContent).toMatch(/published in\s+2021/);
    expect(closer.textContent).toMatch(/flatters our own numbers/);
  });

  it("prices one rung with the measured run, every model in the same direction", () => {
    render(<Page15 />);
    expect(screen.getByRole("heading", { name: /What the window costs/ })).toBeInTheDocument();
    expect(screen.getByText(/measured · our own run · no new generation/)).toBeInTheDocument();
    // The three readouts, pinned to lib/page15Price.ts's derivation.
    for (const [label, ratio, drop] of [
      ["Qwen2.5-1.5B", "2.5x", "34 points"],
      ["Qwen2.5-3B", "2.3x", "31 points"],
      ["Qwen2.5-7B", "2.0x", "28 points"],
    ] as const) {
      // The label also appears as an SVG <text> on the chart, which has no <p>
      // ancestor; the readout strip below the figure is the one with prose.
      const row = screen
        .getAllByText(label)
        .map((el) => el.closest("p"))
        .find((p): p is HTMLParagraphElement => p !== null);
      expect(row, `no readout row for ${label}`).toBeDefined();
      expect(row!.textContent).toMatch(ratio);
      expect(row!.textContent).toMatch(drop);
    }
  });

  it("says why the figure is two difficulty bands and not a benchmark ladder", () => {
    render(<Page15 />);
    // Section 1 teaches that a number compared across reports is meaningless.
    // A cross-benchmark token ladder would break that rule two sections later.
    // This has to read as the page applying its own lesson, not as a methods
    // defence, so it is one caption sentence and not a paragraph.
    const cap = screen.getByText(/Why two halves of one test/).closest("figcaption")!;
    expect(cap.textContent).toMatch(/prompt, grader and answer format all at once/);
    expect(cap.textContent).toMatch(/One rung measured honestly beats a ladder nobody can\s+read/);
    expect(cap.textContent).toMatch(/replayed here rather than generated\s+again/);
  });

  it("keeps the measured section's caveats out of the figure and in the footer", () => {
    render(<Page15 />);
    // The apparatus (unequal n, two runs not one execution, the unpaired
    // specialist, the extrapolation label) is real and has to ship, but beside
    // the figure it drowned the finding 4:1. It lives in the fidelity line.
    const foot = screen.getByText(/every published number on this page/).closest("p")!;
    expect(foot.textContent).toMatch(/50 items at levels 1 to 3 against 100 at levels 4 and 5/);
    expect(foot.textContent).toMatch(/two\s+runs on one instrument rather than one execution/);
    expect(foot.textContent).toMatch(/left out\s+rather than drawn with a hole/);
    expect(foot.textContent).toMatch(/reading a whole benchmark ladder off two rungs is\s+extrapolation/);
  });

  it("gives the price chart a label that carries the claim without the pixels", () => {
    render(<Page15 />);
    const chart = screen.getByRole("img", { name: /Accuracy against tokens spent per problem/ });
    expect(chart.getAttribute("aria-label")).toMatch(/moves right and down/);
    expect(chart.getAttribute("aria-label")).toMatch(/Qwen2\.5-7B spends 323 tokens at 88%/);
  });

  it("carries no em dash or en dash in rendered copy", () => {
    const { container } = render(<Page15 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });

  it("gives every numbered cite on the page a reference entry", () => {
    render(<Page15 />);
    // Cite renders an anchor to #ref-N and RefItem carries that id, so a cite
    // with no entry is a link that jumps nowhere.
    const dangling = Array.from(document.querySelectorAll('a[href^="#ref-"]'))
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id));
    expect(dangling).toEqual([]);
  });
});
