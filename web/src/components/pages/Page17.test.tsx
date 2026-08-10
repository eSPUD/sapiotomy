import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { PAGE17 } from "@/lib/page17";
import { Page17 } from "./Page17";

/**
 * Page 17's test file. It was the only page in 1-19 without one, and the absence
 * was not free: two defects lived here precisely because nothing read this
 * page's text.
 *
 * The original guard was that step 2 must not refute step 1: step 1 measures a
 * re-read, which cannot solve anything new, and step 2's authored chain gave
 * every pass a 45% chance of solving something unsolved. That chain is gone.
 * Step 2 is now a measured run, so the guard changes shape rather than
 * disappearing: what step 2 must not do is oversell one specimen.
 *
 * Hence the unusual tests below. Three controls were run to break the
 * specimen's story, all three partly succeeded, and the page prints all three.
 * The claims behind them are pinned FALSE on purpose. If a future run flips
 * one, these fail, and that is correct: it is a finding that needs new copy,
 * not a green suite.
 */

const budgetSlider = () => screen.getByRole("slider", { name: /token budget/i });
const setBudget = (i: number) =>
  fireEvent.change(budgetSlider(), { target: { value: String(i) } });

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

  // ---- step 2: measured, specimen-led, and fenced by its own controls ----

  it("keeps step 1's re-read apart from step 2's fresh working", () => {
    render(<Page17 />);
    const step2 = budgetSlider().closest("section")!;
    expect(step2.textContent).toMatch(/Step 1 held the model to a re-read/i);
    expect(step2.textContent).toMatch(/let it write fresh working/i);
    // The old slider was called "extra passes" and modelled revision. Nothing on the
    // page may imply step 2 is step 1 run again.
    expect(screen.queryByRole("slider", { name: /revision|extra passes/i })).toBeNull();
  });

  it("draws the losses page 6's curve nets out, on every rung", () => {
    render(<Page17 />);
    const fig = screen.getByRole("img", { name: /gained and lost at each doubling/i });
    expect(fig.getAttribute("aria-label")).toMatch(/Every rung loses answers/i);
    for (const rung of PAGE17.ledger.primary) expect(rung.lost).toBeGreaterThan(0);
  });

  it("blames the empty top rung on the axis rather than on the model", () => {
    render(<Page17 />);
    // Under greedy decoding a self-terminated chain is not rerun at a larger budget.
    // Without this the flat top reads as a measured plateau.
    const step2 = budgetSlider().closest("section")!;
    expect(step2.textContent).toMatch(/it is the same generation/i);
    expect(step2.textContent).toMatch(/The axis runs out before the model does/i);
  });

  it("walks the specimen from a forced commit to its own wrong ending", () => {
    render(<Page17 />);
    const first = PAGE17.specimen.rightWhenCutAt[0];
    setBudget(PAGE17.run.budgets.indexOf(first));
    expect(screen.getByText(new RegExp(`cut at ${first} tokens`, "i"))).toBeInTheDocument();
    expect(screen.getByText(/answered.*right/i)).toBeInTheDocument();

    setBudget(PAGE17.run.budgets.length - 1);
    expect(screen.getByText(/its own ending/i)).toBeInTheDocument();
    expect(screen.getByText(/answered.*wrong/i)).toBeInTheDocument();
  });

  it("lights the step that costs it, and says why that step is wrong", () => {
    render(<Page17 />);
    setBudget(PAGE17.run.budgets.length - 1);
    expect(screen.getByText(new RegExp(PAGE17.specimen.zones.why, "i"))).toBeInTheDocument();
  });

  it("states how much of the chain it folded away", () => {
    render(<Page17 />);
    setBudget(PAGE17.run.budgets.length - 1);
    // An elision that does not say its size lets a cropped chain read as a tidy one.
    expect(screen.getAllByText(/more characters of working/i).length).toBeGreaterThan(0);
  });

  it("prints all three controls beside the specimen, not in a footnote", () => {
    render(<Page17 />);
    const step2 = budgetSlider().closest("section")!;
    expect(step2.textContent).toMatch(/Not a truncated proof/i);
    expect(step2.textContent).toMatch(/Not the model already knowing/i);
    expect(step2.textContent).toMatch(/Not a strategy/i);
  });

  it("pins the three controls to claims the run came back false on", () => {
    // These are the assertions that stop the specimen becoming a strategy the reader
    // takes away. Each is false in the shipped run and the copy depends on it.
    expect(PAGE17.controls.concludedWhenCut.cameFromFinishedReasoning).toBe(false);
    expect(PAGE17.controls.isItARule.stoppingEarlyIsAStrategy).toBe(false);
    expect(PAGE17.controls.isItARule.cutPointsBeatResampling).toBe(false);
    render(<Page17 />);
    expect(screen.getByText(/coverage without page 8's selector/i)).toBeInTheDocument();
  });

  it("makes its one aggregate claim about capability, not about budgets", () => {
    render(<Page17 />);
    expect(
      screen.getByText(/the better the model, the less of this it does/i),
    ).toBeInTheDocument();
    for (const m of PAGE17.affected.byModel) {
      expect(screen.getAllByText(String(m.rescued)).length).toBeGreaterThan(0);
    }
  });

  // ---- step 3: the verifier step, which is the deck's own measurement ----

  it("draws the temperature sweep, and names the knob that causes the decay", () => {
    render(<Page17 />);
    const fig = screen.getByRole("img", { name: /against sampling temperature/i });
    expect(fig).toBeInTheDocument();
    // The x axis has to name what it is, because the whole point is that the knob
    // belongs to page 8's method rather than to the judge.
    expect(screen.getByText(/the knob that buys candidate diversity/i)).toBeInTheDocument();
  });

  it("says the sweep holds candidate depth fixed, since reliability decays with N too", () => {
    render(<Page17 />);
    const fig = screen.getByRole("img", { name: /against sampling temperature/i });
    expect(fig.getAttribute("aria-label")).toMatch(
      new RegExp(`measured over ${PAGE17.reliability.depth} candidates`, "i"),
    );
    expect(
      screen.getByText(/Candidate depth is held at .* throughout/i),
    ).toBeInTheDocument();
  });

  it("makes the crossing the claim rather than any one column", () => {
    render(<Page17 />);
    expect(screen.getByText(/read it left to right/i)).toBeInTheDocument();
    expect(screen.getByText(/starts mid-pack/i)).toBeInTheDocument();
    // The contrast the figure is built on: asked to judge against trained to score.
    const step3 = screen
      .getByRole("img", { name: /against sampling temperature/i })
      .closest("section")!;
    expect(step3.textContent).toMatch(/a model asked to judge/i);
    expect(step3.textContent).toMatch(/trained to score/i);
  });

  it("draws the share of the chain no checker can read, at true width", () => {
    render(<Page17 />);
    const bar = screen.getByRole("img", { name: /arithmetic checker can adjudicate/i });
    expect(bar.getAttribute("aria-label")).toMatch(/state nothing it can compute/i);
    // Where the reward model's numbers were taken is the claim, so the figure has to
    // say it rather than leave the two facts adjacent and unjoined.
    expect(bar.getAttribute("aria-label")).toMatch(/was measured inside/i);
    expect(screen.getByText(/were\s+all measured in here/i)).toBeInTheDocument();
  });

  it("prices trusting the grader anyway, in the two ways we measured", () => {
    render(<Page17 />);
    // The step filter's null, quoted as the one problem it moved rather than as a
    // percentage, because one in a hundred is the honest unit here.
    expect(
      screen.getByText(/Filtering\s+page 7's candidates by the soundness of their working/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/where the chain is cut into steps/i)).toBeInTheDocument();
  });

  it("no longer claims the overthinking threshold it cannot measure", () => {
    render(<Page17 />);
    // The authored inverse-U asserted that easy problems cross a threshold before hard
    // ones. Pooled over all three checkpoints the medians are identical, so the claim is
    // gone from the page rather than softened. See docs/page_17_findings.md section 4.
    expect(PAGE17.levelNull.easyBreaksSooner).toBe(false);
    // No figure asserts it and no step is built on it. The only survival is the
    // footnote, which names it as deleted, and that sentence is required: a claim
    // withdrawn in silence reads to a returning reader as a claim forgotten.
    expect(screen.queryByRole("img", { name: /easy problems against hard ones/i })).toBeNull();
    expect(screen.queryByText(/authored shape/i)).toBeNull();
    // The retraction moved out of the page footer and into the margin note
    // beside step 2, next to the very axis bound that makes the claim
    // unsettleable. It must still be stated somewhere a reader will meet it.
    const retraction = screen.getByText(/retired a claim this page used to make/i).closest("aside")!;
    expect(retraction.textContent).toMatch(/What this axis cannot show/i);
    expect(retraction.textContent).toMatch(/easy problems cross an\s+overthinking threshold/);
    expect(screen.getByText(/deleted rather than softened/i)).toBeInTheDocument();
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
    const caveat = lead.closest("p")!;
    expect(caveat.textContent).toMatch(/Act\s*2 and the frontier scores of Act 3/);
    // Division of labour with page 15, which teaches familiarity as the third
    // way a test stops working. This page owns the size of it, not the
    // mechanism, so it back-references rather than re-deriving.
    expect(caveat.textContent).toMatch(/Page 15 called this the third way a test stops working/);
    expect(caveat.textContent).not.toMatch(/familiarity rather than reasoning/);
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

  it("gives every numbered cite on the page a reference entry", () => {
    render(<Page17 />);
    // Cite renders an anchor to #ref-N and RefItem carries that id, so a cite
    // with no entry is a link that jumps nowhere.
    const dangling = Array.from(document.querySelectorAll('a[href^="#ref-"]'))
      .map((a) => a.getAttribute("href")!.slice(1))
      .filter((id) => !document.getElementById(id));
    expect(dangling).toEqual([]);
  });
});
