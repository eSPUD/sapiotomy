import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page12 } from "./Page12";

describe("Page 12 (STaR and self-improvement)", () => {
  it("opens on the two-sentence hook ending in the answer-key question", () => {
    render(<Page12 />);
    expect(
      screen.getByText(/What happens when you take the answer key away\?/),
    ).toBeInTheDocument();
  });

  it("quotes the full Table 1 row set, including the 23x larger LaMDA bar", () => {
    render(<Page12 />);
    expect(screen.getByText("LaMDA 137B, few-shot CoT")).toBeInTheDocument();
    expect(screen.getByText("55.6%")).toBeInTheDocument();
    // The headline figures repeat in the figcaption; the bars are one each.
    expect(screen.getAllByText("72.5%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("73.0%").length).toBeGreaterThanOrEqual(1);
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

  it("has no controls: the correctness check is always on", () => {
    render(<Page12 />);
    // No step-through button and no answer-key toggle — the check is always on.
    expect(screen.queryByRole("button", { name: /Run iteration/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(screen.queryByText(/No answer key: every rationale trains/)).not.toBeInTheDocument();
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
    const results = screen.getByText("LaMDA 137B, few-shot CoT");
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
    // The results heading carries its source right where the reader looks.
    expect(document.querySelector("h2 sup")).toBeInTheDocument();
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
    // RFT and GVM are preprints and must carry the flag; ExIt and STaR are not.
    expect(screen.getAllByText("preprint").length).toBe(2);
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

  it("has no provenance footnote: the section-2 results are cited inline", () => {
    render(<Page12 />);
    expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    expect(screen.queryByText(/Table 1, CommonsenseQA dev/)).not.toBeInTheDocument();
    // The citation still lives in section 2's heading and figcaption.
    expect(screen.getByRole("heading", { name: /What the loop bought/ })).toBeInTheDocument();
  });
});
