import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { SELF_CORRECTION, selfCorrectionCurve } from "@/lib/frontier";
import { Page17 } from "./Page17";

/**
 * Page 17's first test file. It was the only page in 1-19 without one, and the
 * absence was not free: two defects lived here precisely because nothing read
 * this page's text. Both are pinned below.
 *
 * The first is the reason this file exists at all. Step 1 measures a re-read,
 * which cannot solve anything new; step 2's chain gives every pass a 45%
 * chance of solving something still unsolved. Both are right, and a reader who
 * meets them as one mechanism concludes the page refutes itself with its own
 * slider. What keeps them apart is a sentence in step 2 and the name on the
 * slider, so a sentence and a name are what this file guards.
 *
 * The second is duller: the page pointed at 16 for a result that is on 14.
 */

const P = SELF_CORRECTION;
const unaided = selfCorrectionCurve(P.maxSteps, { ...P, reliability: null });
const peak = unaided.reduce((a, p) => (p.y > a.y ? p : a));

const passSlider = () => screen.getByRole("slider", { name: /extra passes/i });
const setPasses = (n: number) => fireEvent.change(passSlider(), { target: { value: String(n) } });
const verifierToggle = () => screen.getByRole("switch", { name: /external verifier/i });

describe("Page 17 (when reasoning breaks) component", () => {
  it("prints Huang et al.'s Table 3 rows verbatim, both getting worse", () => {
    render(<Page17 />);
    const h = curves.selfCorrection.fit!.params;
    for (const v of [
      h.gpt4Gsm8k0, h.gpt4Gsm8k1, h.gpt4Gsm8k2,
      h.gpt35Csqa0, h.gpt35Csqa1, h.gpt35Csqa2,
    ]) {
      expect(screen.getAllByText(v.toFixed(1)).length).toBeGreaterThan(0);
    }
    // Round 1 is below round 0 on both panels: that IS the finding.
    expect(h.gpt4Gsm8k1).toBeLessThan(h.gpt4Gsm8k0);
    expect(h.gpt35Csqa1).toBeLessThan(h.gpt35Csqa0);
  });

  it("scopes step 1 to a re-read with nothing new entering the system", () => {
    render(<Page17 />);
    expect(screen.getByText(/no hints, no tools, just re-reading/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing new enters the system/i)).toBeInTheDocument();
  });

  // ---- the guard that this page's step 2 does not refute its own step 1 ----

  it("does not call step 2's passes revisions", () => {
    render(<Page17 />);
    expect(passSlider()).toBeInTheDocument();
    expect(screen.queryByRole("slider", { name: /revision/i })).not.toBeInTheDocument();
  });

  it("says on screen that a pass makes fresh attempts, which is what solves", () => {
    render(<Page17 />);
    const step2 = screen.getByRole("slider", { name: /extra passes/i }).closest("section")!;
    // The mechanism, not just the word: new working, explicitly not a re-read.
    expect(step2.textContent).toMatch(/fresh attempt/i);
    expect(step2.textContent).toMatch(/new working rather than a review of the old answer/i);
    // ...and the page owns which half of the pass step 1 measured.
    expect(step2.textContent).toMatch(/the first half is the part step 1 never offered the model/i);
    expect(step2.textContent).toMatch(new RegExp(`${P.solveProb * 100}% of them`));
  });

  it("walks the reader up to the sweet spot and off the cliff", () => {
    render(<Page17 />);
    setPasses(peak.x);
    expect(screen.getByText(/solving and second-guessing exactly balance/i)).toBeInTheDocument();
    setPasses(P.maxSteps);
    expect(
      screen.getByText(new RegExp(`Past the peak \\(${peak.y.toFixed(0)}% at ${peak.x} passes\\)`)),
    ).toBeInTheDocument();
  });

  it("charges the verifier's ceiling to both of its errors, not only false positives", () => {
    render(<Page17 />);
    fireEvent.click(verifierToggle());
    const verdict = screen.getByText(/bad\s+edits it waves through/i);
    // frontier.ts scales genuine repairs by the same reliability (fix = fixProb
    // * reliability), so blaming the whole gap on waved-through edits is half
    // the model. The copy has to charge the blocked repairs too.
    expect(verdict.textContent).toMatch(/genuine repairs it blocks/i);
  });

  // ---- step 3: overthinking, which had no figure until it had this one ----

  it("draws the overthinking pair the title promises", () => {
    render(<Page17 />);
    expect(
      screen.getByRole("img", { name: /easy problems against hard ones/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/overthinking threshold/i)).toBeInTheDocument();
  });

  it("puts the easy peak before the hard one, which is the whole claim", () => {
    render(<Page17 />);
    const ot = curves.overthinking.fit!.params;
    expect(ot.easyPeak).toBeLessThan(ot.hardPeak);
    expect(screen.getByText(`peak at ${ot.easyPeak}`)).toBeInTheDocument();
    expect(screen.getByText(`peak at ${ot.hardPeak}`)).toBeInTheDocument();
    expect(screen.getByText(/too long for the easy problems, too short for the hard ones/i))
      .toBeInTheDocument();
  });

  it("discloses the figure as an authored shape and says what it does not assert", () => {
    render(<Page17 />);
    expect(screen.getByText(/authored shape · direction from the preprints/i)).toBeInTheDocument();
    expect(screen.getByText(/not the depth of either fall/i)).toBeInTheDocument();
  });

  // ---- cross-references and the seam ----

  it("sends the reader to page 14 for R1's learned re-check, not page 16", () => {
    render(<Page17 />);
    const claim = screen.getByText(/RL taught DeepSeek-R1/i);
    expect(claim.textContent).toMatch(/\(page 14\)/);
    expect(claim.textContent).not.toMatch(/page 16/);
  });

  it("promotes the contamination caveat out of a trailing muted line", () => {
    render(<Page17 />);
    expect(screen.getByText(/one caveat that reaches backwards/i)).toBeInTheDocument();
    // Bolded, and scoped to the whole story rather than to this page's demo.
    const lead = screen.getByText(/measured on problems the model may/i);
    expect(lead.tagName).toBe("STRONG");
    expect(lead.closest("p")!.textContent).toMatch(/Act\s*2 and the frontier scores of Act 3/);
  });

  it("hands a live question forward to 18 instead of ending on a reference note", () => {
    render(<Page17 />);
    const handoff = screen.getByText(/whether the written chain is the real reason at all/i);
    expect(handoff.closest("div")!.textContent).toMatch(/all three take it for what it says it is/i);
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced on pages 5-9, 13 and 14: visible copy uses
    // commas, colons or semicolons, and ranges are spelled out ("7 to 30
    // points"). Covers aria-labels and chart titles, which screen readers speak.
    const { container } = render(<Page17 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });
});
