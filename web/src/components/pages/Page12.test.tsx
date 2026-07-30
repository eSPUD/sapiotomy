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

  it("keeps the training and test regimes apart with labelled panels", () => {
    render(<Page12 />);
    expect(screen.getByText(/Training · what this round produced/)).toBeInTheDocument();
    expect(screen.getByText(/Test · how good did it get\?/)).toBeInTheDocument();
    // The Test panel carries the figure's only chart: an accuracy sparkline.
    expect(screen.getByRole("img", { name: /Held-out accuracy across 0 iterations/ })).toBeInTheDocument();
    // The legend renders only non-empty categories; nothing is verified yet.
    expect(screen.queryByText(/verified rationale/)).not.toBeInTheDocument();
    expect(screen.getByText(/not in the set \(60\)/)).toBeInTheDocument();
  });

  it("draws the strip as an abstraction: frontier, state matrix, no notation", () => {
    render(<Page12 />);
    expect(screen.getByText(/solve frontier \(50\/50 odds\)/)).toBeInTheDocument();
    // The sidenote matrix maps each toggle state to what the reader watches.
    expect(screen.getByText("filter on · rationalization off")).toBeInTheDocument();
    expect(screen.getByText(/Full STaR/)).toBeInTheDocument();
    expect(screen.getByText(/No reward, no loop/)).toBeInTheDocument();
    // No notation anywhere: the strip and sparkline carry the mechanism.
    expect(screen.queryByText(/Dₙ/)).not.toBeInTheDocument();
    expect(screen.getByText(/a training set it could not/)).toBeInTheDocument();
  });

  it("carries the GSM8K caveat on the rationalization claim", () => {
    render(<Page12 />);
    expect(screen.getByText(/did not substantially improve GSM8K/)).toBeInTheDocument();
  });

  it("states the calibration anchors the simulation reproduces", () => {
    render(<Page12 />);
    expect(screen.getByText(/GPT-J few-shot CoT: 36\.6%/)).toBeInTheDocument();
    expect(screen.getByText(/STaR's 68\.8%/)).toBeInTheDocument();
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
    const interactive = screen.getByText(/Run iteration 1/);
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

  it("explains the algorithm in plain language below the listing", () => {
    render(<Page12 />);
    const explained = screen.getByText(/The algorithm, explained/);
    const listing = screen.getByText(/hint = y/);
    expect(
      listing.compareDocumentPosition(explained) & Node.DOCUMENT_POSITION_FOLLOWING,
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
  });

  it("closes on the hand-off to page 13's frontier reasoners", () => {
    render(<Page12 />);
    expect(screen.getByText(/Page 13 picks it up from there/)).toBeInTheDocument();
  });

  it("labels the footer provenance as Simulated and Cited", () => {
    render(<Page12 />);
    expect(screen.getByText("Simulated")).toBeInTheDocument();
    expect(screen.getByText("Cited")).toBeInTheDocument();
    expect(screen.getByText(/Table 1, CommonsenseQA dev/)).toBeInTheDocument();
  });
});
