import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Page12 } from "./Page12";

describe("Page 12 (STaR and self-improvement)", () => {
  it("opens on the two-sentence hook ending in the answer-key question", () => {
    render(<Page12 />);
    expect(
      screen.getByText(/What happens when you take the answer key away\?/),
    ).toBeInTheDocument();
  });

  it("runs STaR's filter over page 7's pile in section 2, with no Table 1 bar chart", () => {
    // Reduced motion, so Play shows the whole pass at once.
    const mm = window.matchMedia;
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q })) as unknown as typeof window.matchMedia;
    try {
      render(<Page12 />);
      expect(screen.getByRole("heading", { name: /2\. Which reasoning goes into the training set\?/ })).toBeInTheDocument();
      expect(screen.queryByText("LaMDA 137B, few-shot CoT")).not.toBeInTheDocument();
      // STaR as published and nothing else: one greedy chain, the answer key, a rationalization switch.
      expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
      expect(screen.queryByRole("slider")).not.toBeInTheDocument();
      expect(screen.queryByText(/majority/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/step grader/i)).not.toBeInTheDocument();
      // As on page 5: empty until Play, cleared by Reset.
      const play = screen.getByRole("button", { name: /Play/ });
      const reset = screen.getByRole("button", { name: /Reset/ });
      expect(screen.getByText(/press Play to see its reply/)).toBeInTheDocument();
      expect(play).toBeEnabled();
      expect(reset).toBeDisabled();
      fireEvent.click(play);
      expect(play).toBeDisabled();
      expect(reset).toBeEnabled();
      expect(screen.getByRole("group", { name: /the one chain decoded greedily/ })).toBeInTheDocument();
      expect(screen.getByText(/Selected by the answer\. Trained on the reasoning\./)).toBeInTheDocument();
      // Rationalization is a small switch, on by default because it is part of STaR as published.
      const sw = screen.getByRole("switch", { name: /Rationalization/ });
      expect(sw).toHaveAttribute("aria-checked", "true");
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.getByRole("img", { name: /^96 of 100 problems put reasoning into the training set, 53 of them through rationalization/ })).toBeInTheDocument();
      // Off is the paper's ablation, and says so.
      fireEvent.click(sw);
      expect(screen.getByText(/STaR without rationalization, the paper's ablation/)).toBeInTheDocument();
      expect(screen.getByRole("img", { name: /^43 of 100 problems put reasoning into the training set, none with a wrong answer/ })).toBeInTheDocument();
      // A new problem starts empty again. The headline follows the switch.
      fireEvent.click(screen.getByRole("button", { name: "previous problem" }));
      expect(screen.getByText(/press Play to see its reply/)).toBeInTheDocument();
      fireEvent.click(play);
      expect(screen.getByText("The greedy chain misses, so nothing goes in.")).toBeInTheDocument();
      fireEvent.click(sw);
      expect(screen.getByText("The greedy chain misses, and so does the hinted retry.")).toBeInTheDocument();
      // The second problem is rescued by the hint.
      fireEvent.click(screen.getByRole("button", { name: "next problem" }));
      fireEvent.click(screen.getByRole("button", { name: "next problem" }));
      fireEvent.click(play);
      expect(screen.getByText(/written with the hint; filed without it/)).toBeInTheDocument();
      fireEvent.click(reset);
      expect(screen.getByText(/press Play to see its reply/)).toBeInTheDocument();
      expect(screen.queryByText(/page 7's vote/)).not.toBeInTheDocument();
    } finally {
      window.matchMedia = mm;
    }
  });

  it("plays one problem's pass a step at a time, and Reset clears it", () => {
    vi.useFakeTimers();
    try {
      render(<Page12 />);
      const pass = screen.getByRole("list", { name: /STaR's pass for this problem/ });
      const steps = () => within(pass).queryAllByRole("listitem").length;
      const play = screen.getByRole("button", { name: /Play/ });
      expect(steps()).toBe(0);
      expect(screen.getByText("Press Play to run one pass of STaR on this problem.")).toBeInTheDocument();
      fireEvent.click(play);
      expect(steps()).toBe(1);
      expect(screen.getByText("One pass of STaR, step by step.")).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(2700));
      expect(steps()).toBe(2);
      act(() => vi.advanceTimersByTime(1700));
      expect(steps()).toBe(3);
      act(() => vi.advanceTimersByTime(1900));
      // The whole pass stays on screen.
      expect(screen.getByText("The greedy chain is right, so its reasoning goes in.")).toBeInTheDocument();
      expect(play).toBeDisabled();
      fireEvent.click(screen.getByRole("button", { name: /Reset/ }));
      expect(steps()).toBe(0);
      // Flipping rationalization mid-play shows the whole pass at once.
      fireEvent.click(play);
      fireEvent.click(screen.getByRole("switch", { name: /Rationalization/ }));
      expect(steps()).toBe(3);
      expect(screen.getByText("The greedy chain is right, so its reasoning goes in.")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("draws the loop as a diagram, with no simulated accuracy chart", () => {
    render(<Page12 />);
    // Section 1 is the animated loop graph now.
    expect(screen.getByRole("img", { name: /STaR's loop/ })).toBeInTheDocument();
    // The seeded accuracy/training-set chart and its Test panel are gone.
    expect(screen.queryByText(/Test · how good did it get/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /Held-out accuracy and training-set share/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps section 1 free of controls: the loop's correctness check is always on", () => {
    render(<Page12 />);
    expect(screen.queryByRole("button", { name: /Run iteration/ })).not.toBeInTheDocument();
    // Section 2 has its rationalization switch; section 1 has none.
    const s1 = screen.getByRole("heading", { name: "1. Run the loop" }).closest("section")!;
    expect(within(s1).queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText(/No answer key: every rationale trains/)).not.toBeInTheDocument();
  });

  /**
   * Pages 5 to 9, 11 and 13 to 16 each carry this guard. Page 12 did not, and it
   * had six live violations in its own copy (two pseudocode annotations, the
   * figcaption's &mdash;, and three in prose), all fixed on 2026-08-10 with
   * colons and parentheses rather than by rewording.
   */
  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page12 />);
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
  });

  it("rests the loop on the answer key, with no math notation", () => {
    render(<Page12 />);
    expect(
      screen.getByText(/external signal deciding what the model may study/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Dₙ/)).not.toBeInTheDocument();
  });

  it("writes the loop down, with the rationalization branch and fine-tune-from-base", () => {
    render(<Page12 />);
    expect(screen.getByText(/hint = y/)).toBeInTheDocument();
    // M₀ is markup (M<sub>0</sub>), so match the assembled text of the code line.
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "M ← finetune(M0, kept)",
      ),
    ).toBeInTheDocument();
  });

  it("orders the page: listing after the interactive, before the results, closers last", () => {
    render(<Page12 />);
    const interactive = screen.getByText(/Everything rests on the answer key/);
    const listing = screen.getByText(/hint = y/);
    const results = screen.getByRole("heading", { name: /Which reasoning goes into the training set/ });
    const counterweight = screen.getByText(/Trained on reasoning, graded on answers/);
    const handoff = screen.getByText(/Page 13 picks it up from there/);
    const follows = (a: Element, b: Element) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(follows(interactive, listing)).toBe(true);
    expect(follows(listing, results)).toBe(true);
    // The counterweight and the hand-off stay at the page bottom: they read
    // over both the listing and the results, and the hand-off closes the page.
    expect(follows(results, counterweight)).toBe(true);
    expect(follows(counterweight, handoff)).toBe(true);
  });

  it("explains the algorithm in plain language under the section header, before the listing", () => {
    render(<Page12 />);
    const explained = screen.getByText(/The algorithm, explained/);
    const header = screen.getByRole("heading", { name: /1\. Run the loop/ });
    const listing = screen.getByText(/hint = y/);
    // The explanation now leads section 1 (after the header, before the listing).
    expect(
      header.compareDocumentPosition(explained) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      explained.compareDocumentPosition(listing) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("keeps one counterweight below the listing: trained on reasoning, graded on answers", () => {
    render(<Page12 />);
    expect(screen.getByText(/Trained on reasoning, graded on answers/)).toBeInTheDocument();
    expect(screen.getByText(/it's imitated/)).toBeInTheDocument();
    // The RL reading lives in the annotation column, not a separate block.
    // Line 6 keeps the literal mapping; line 2 carries it via the ExIt cite.
    expect(screen.getAllByText(/in RL terms:/).length).toBe(1);
    expect(screen.queryByText(/V-STaR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ReST/)).not.toBeInTheDocument();
    // STaR decodes greedily — the "distills luck into skill" story is wrong and must stay out.
    expect(screen.queryByText(/luck into skill/)).not.toBeInTheDocument();
  });

  it("grounds the loop outside STaR: ExIt on line 2, RFT on line 5, GVM in the counterweight", () => {
    render(<Page12 />);
    // Line 2: the RL lineage, with an exit condition tied to section 1's plateau.
    expect(
      screen.getByText(
        (_, el) => el?.tagName === "CODE" && el.textContent === "loop: until accuracy plateaus",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/expert iteration \(Anthony et al\. 2017\)/)).toBeInTheDocument();
    // Line 5: greedy decoding stated correctly, RFT named as the sample-k variant.
    expect(screen.getByText(/one greedy rollout/)).toBeInTheDocument();
    expect(screen.getByText(/RFT \(Yuan et al\. 2023\) samples k/)).toBeInTheDocument();
    // Cite markers live in prose (page 2/3 convention), never in the annotation
    // column: the annotations name the papers, the figcaption carries the sups.
    expect(
      screen.getByText(/expert iteration \(Anthony et al\. 2017\)/).querySelector("sup"),
    ).toBeNull();
    expect(screen.getByText(/one greedy rollout/).querySelector("sup")).toBeNull();
    // The measured section names its source right where the reader looks.
    expect(screen.getByRole("heading", { name: /Which reasoning goes into the training set/ }).textContent).toMatch(
      /measured · Qwen2\.5-3B-Instruct · 100 MATH-500 problems/,
    );
    expect(screen.queryByText(/sample from the current policy/)).not.toBeInTheDocument();
    // The counterweight's claim has outside experimental support.
    expect(screen.getByText(/wrong reasoning path/)).toBeInTheDocument();
    // Never "synonymous": the page may not conflate STaR and RFT.
    expect(screen.queryByText(/synonymous/)).not.toBeInTheDocument();
  });

  it("links all four references from the sidenote", () => {
    render(<Page12 />);
    const hrefs = [
      "https://arxiv.org/abs/2203.14465",
      "https://arxiv.org/abs/1705.08439",
      "https://arxiv.org/abs/2308.01825",
      "https://arxiv.org/abs/2505.02391",
    ];
    for (const href of hrefs) {
      expect(document.querySelector(`a[href="${href}"]`)).toBeInTheDocument();
    }
    // References carry no preprint tag.
    expect(screen.queryByText("preprint")).toBeNull();
    // Section 1 and 2 are merged now: STaR, ExIt and RFT share one References
    // note beside that section; GVM sits last, beside the closing blocks.
    const gvmRef = document.querySelector('a[href="https://arxiv.org/abs/2505.02391"]')!;
    for (const href of hrefs.slice(0, 3)) {
      const ref = document.querySelector(`a[href="${href}"]`)!;
      expect(ref.compareDocumentPosition(gvmRef) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("closes on the hand-off to page 13's frontier reasoners, in page 11's idiom", () => {
    render(<Page12 />);
    // The hand-off is a bulleted block now, so read its wrapping div.
    const handoff = screen.getByText(/Page 13 picks it up from there/).closest("div")!;
    // The lift-vs-slide bridge: page 11 said model size picks your curve; STaR
    // is the first knob that lifts it, which page 13's two-knob law completes.
    expect(handoff.textContent).toMatch(/lifts the curve without buying a single\s+parameter/i);
  });

  it("closes on both ways to spend, then the frontier turning both", () => {
    render(<Page12 />);
    // The hand-off is a bulleted block now, so read its wrapping div.
    const handoff = screen.getByText(/Page 13 picks it up from there/).closest("div")!;
    // The hand-off sums the pair page 13's two compute axes pick up: Act 2's
    // answer-time toolbox (5-11, priced by page 11) and this page's
    // train-time loop.
    expect(handoff.textContent).toMatch(/two ways to buy reasoning/);
    expect(handoff.textContent).toMatch(/Act 2 spends the compute after the question lands/);
    expect(handoff.textContent).toMatch(/spends long before the\s+question exists/);
    // It must NOT announce Act 3 as upcoming: the seam is 11|12, so this page
    // is already Act 3's first page (see pages.ts).
    expect(handoff.textContent).not.toMatch(/Act 3/);
    // And it names the price, which is what makes the frontier a trade.
    expect(handoff.textContent).toMatch(/turns both\s+kinds of spending at once and bills you for each/);
  });

  it("sits in Act 3: page 12 opens the act, it does not close Act 2", () => {
    render(<Page12 />);
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
  });

  it("has no provenance footnote: section 2 names its run in its heading", () => {
    render(<Page12 />);
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    expect(screen.queryByText(/Table 1, CommonsenseQA dev/)).not.toBeInTheDocument();
    // Section 2's provenance is its heading badge, not a footnote.
    expect(screen.getByRole("heading", { name: /Which reasoning goes into the training set/ })).toBeInTheDocument();
  });
});
