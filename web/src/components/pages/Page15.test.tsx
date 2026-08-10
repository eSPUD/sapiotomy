import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page15 } from "./Page15";

const pickCase = (name: RegExp) => fireEvent.click(screen.getByRole("button", { name }));

describe("Page 15 (the scoreboard) component", () => {
  it("opens on the house two-sentence intro, concrete before abstract", () => {
    render(<Page15 />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toMatch(
      /The Scoreboard: Benchmarks That Track Reasoning/,
    );
    const intro = screen.getByText(/not a property of a model/).closest("p")!;
    expect(intro.textContent).toMatch(/74\.4% vs 93%, and both are true/);
    expect(intro.textContent).toMatch(/the conditions it was taken under/);
    // No table of contents for the rest of the deck: no other page does that,
    // and the handoff belongs in the closing transition block.
    expect(intro.textContent).not.toMatch(/page 1[6-9]|the last two/i);
    expect(intro.textContent!.split(/\s+/).length).toBeLessThan(60);
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

  it("the FrontierMath case reveals that every condition moved at once", () => {
    render(<Page15 />);
    pickCase(/^o3 on FrontierMath$/);
    expect(screen.getByText(/“o3 scores 25\.2% on FrontierMath”/)).toBeInTheDocument();
    expect(screen.getByText(/“o3 scores 10% on FrontierMath”/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "whose harness scored it" }));
    expect(screen.getByText("all four conditions at once")).toBeInTheDocument();
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
    expect(screen.getByText(/Tests still telling these models apart/)).toBeInTheDocument();
    expect(screen.getByText("2 of 4")).toBeInTheDocument();
  });

  it("maxing the frontier blinds every test and calls for new goalposts", () => {
    render(<Page15 />);
    fireEvent.change(screen.getByRole("slider", { name: /frontier capability/ }), {
      target: { value: "12" },
    });
    expect(screen.getAllByText("no signal: everyone passes")).toHaveLength(4);
    expect(screen.getByText(/Every test here is now too easy/)).toBeInTheDocument();
    expect(screen.getByText(/moving the goalposts is the system working/)).toBeInTheDocument();
  });

  it("the figure makes no live status claims and discloses its authored shape", () => {
    render(<Page15 />);
    expect(screen.queryByText(/still standing/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^standing/)).not.toBeInTheDocument();
    expect(screen.getByText(/The four tests above are invented/)).toBeInTheDocument();
    // History appears only as immutable facts, FrontierMath only as its launch state.
    expect(screen.getByText(/FrontierMath launched with every model on earth scoring under 2%/)).toBeInTheDocument();
    expect(screen.getByText(/each one made it faster than the test before/)).toBeInTheDocument();
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
    // Its story is the price tag and page 16 tells it with a dollar axis, so
    // it appears nowhere here, not even as a case button.
    expect(screen.queryByRole("button", { name: /ARC/ })).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/ARC-AGI/);
  });

  it("puts references beside the step that uses them, as pages 2-5 do", () => {
    render(<Page15 />);
    const notes = screen.getAllByText("References").map((h) => h.closest("aside")!);
    // One block per section that cites anything, not one pile at the foot.
    expect(notes.length).toBeGreaterThanOrEqual(4);
    const [first, second, third, last] = notes;
    expect(first.textContent).toMatch(/OpenAI 2024/);
    expect(second.textContent).toMatch(/Cobbe et al\. 2021/);
    expect(third.textContent).toMatch(/Snell et al\. 2024/);
    expect(last.textContent).toMatch(/Lewkowycz et al\. 2022/);
    for (const n of notes) expect(n.textContent).not.toMatch(/Table 3/);
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

  it("flags the non-peer-reviewed sources with the deck's preprint badge", () => {
    render(<Page15 />);
    // The footnote that said this in prose is gone; RefItem's badge carries it
    // now, on the o1/o3 announcements and on FrontierMath.
    const badges = screen.getAllByText(/preprint/i);
    expect(badges.length).toBeGreaterThanOrEqual(2);
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
    expect(document.body.textContent).not.toMatch(/page 2[01]/i);
    // The only forward pointer left is the closing transition to page 16.
    expect(screen.getByText(/Next: the bill/)).toBeInTheDocument();
  });

  it("gives the capability axis an anchor that cannot rot", () => {
    render(<Page15 />);
    expect(screen.getByRole("slider", { name: /ordinal, not calibrated to any date/i }))
      .toBeInTheDocument();
    expect(screen.getByText(/Today is always wherever the newest test/i)).toBeInTheDocument();
  });

  it("names the third way a test dies and applies it to our own run", () => {
    render(<Page15 />);
    // Two of the three are on the slider; this one is not, which is why it sits
    // outside the figure card rather than inside it.
    expect(screen.getByText(/three ways/i)).toBeInTheDocument();
    const closer = screen.getByText(/The third way is different/i).closest("p")!;
    expect(closer.textContent).toMatch(/rewarding memory instead of reasoning/);
    expect(closer.textContent).toMatch(/Page 17 puts a number on it/);
    // It has to reach our own instrument or the page exempts itself from the
    // thing it just taught: MATH-500's problems are from 2021.
    const ours = screen.getByText(/And it reaches us/).closest("p")!;
    expect(ours.textContent).toMatch(/published in 2021/);
    expect(ours.textContent).toMatch(/flatters our own numbers/);
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

  it("reads the figure back as inference-time scaling, not as our methodology", () => {
    render(<Page15 />);
    // Section 1 teaches that a number compared across reports is meaningless.
    // A cross-benchmark token ladder would break that rule two sections later.
    // This has to read as the page applying its own lesson, not as a methods
    // defence, so it is one caption sentence and not a paragraph.
    const cap = screen.getByText(/Act 2 sold you this trade running the other way/).closest("figcaption")!;
    expect(cap.textContent).toMatch(/difficulty charges you twice/);
    expect(cap.textContent).toMatch(/replayed here rather than generated/);
  });

  it("carries the measured section's limits as a sidenote, with no page footnote", () => {
    render(<Page15 />);
    // The footnote is gone: everything the downloadable notebook already
    // states went with it. What a download cannot state is the reading limit,
    // so that survives as a Limits sidenote beside the figure.
    const limits = screen.getByText("Limits").closest("aside")!;
    expect(limits.textContent).toMatch(/not a whole ladder/);
    expect(limits.textContent).toMatch(/extrapolation/);
    expect(limits.textContent).toMatch(/run separately rather than in one execution/);
    expect(limits.textContent).toMatch(/50 problems against the hard half's 100/);
    expect(limits.textContent).toMatch(/left out rather than drawn with a hole/);
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
