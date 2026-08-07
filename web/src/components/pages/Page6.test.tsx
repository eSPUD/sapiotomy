import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Deterministic reduced-motion (nothing on this page animates, but the stub
// keeps the environment consistent with the other page tests).
const mm = (q: string) => ({
  matches: q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page6 } from "./Page6";
import { PAGE6, pct, rowById, tidyMath, traceZones } from "@/lib/page06";

const B = PAGE6.budgets;
const TOP = B[B.length - 1];
const F1 = PAGE6.figure1;
const F2 = PAGE6.figure2;
const F3 = PAGE6.figure3;

// The page opens on a curated row that is NOT the notebook's specimen; see
// PAGE6.figure1.openingId for why. The notebook's pick is still in the picker.
const OPENING = rowById(F1.openingId);
const FLIP_INDEX = B.indexOf(OPENING.firstCorrectBudget!);

const body = () => document.body.textContent ?? "";
const dial = () => screen.getByRole("slider", { name: /token budget/i });
const drag = (i: number) => fireEvent.change(dial(), { target: { value: String(i) } });

describe("Page 6, figure 1: cut it off, make it answer", () => {
  it("opens on the specimen at the smallest budget, cut and forced", () => {
    render(<Page6 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thinking Longer");
    expect(screen.getByText(tidyMath(OPENING.question))).toBeInTheDocument();
    expect(dial()).toHaveValue("0");
    expect(body()).toContain(`${OPENING.byBudget[0].ownTokens} of ${B[0]} tokens thought`);
    expect(body()).toContain("✗ graded wrong");
  });

  it("shows the model's own words and what it was not allowed to write", () => {
    render(<Page6 />);
    const z = traceZones(OPENING, 0);
    // Both halves are on the page. The greyed continuation is the single most
    // important pixel here: hiding it would turn the figure into a progress bar.
    expect(body()).toContain(tidyMath(z.own).slice(0, 60));
    expect(body()).toContain(tidyMath(z.unwritten).slice(-60));
    expect(body()).toContain("we close the block and make it commit");
  });

  it("the verdict flips at the measured budget, and does not slide to get there", () => {
    render(<Page6 />);
    // Every budget below the flip grades wrong; the flip budget grades correct.
    for (let i = 0; i < FLIP_INDEX; i++) {
      drag(i);
      expect(body()).toContain("✗ graded wrong");
    }
    drag(FLIP_INDEX);
    expect(body()).toContain("✓ graded correct");
    expect(body()).toContain(`answered ${tidyMath(OPENING.byBudget[FLIP_INDEX].extractedAnswer)}`);
  });

  it("stops cutting once the chain finishes inside its budget", () => {
    render(<Page6 />);
    const finishedIndex = OPENING.byBudget.findIndex((r) => !r.forced);
    drag(finishedIndex);
    expect(body()).toContain("nothing was cut and nothing was forced");
    expect(body()).not.toContain("we close the block and make it commit");
  });

  it("opens on a flip the model earned, not one the grader handed it", () => {
    // The notebook's own specimen flips at 512 only because at 256 it wrote the
    // right value behind the prompt template's placeholder. The page opens on a
    // row that is wrong for a real reason and then right.
    expect(F1.openingId).not.toBe(F1.specimenId);
    for (const r of OPENING.byBudget) expect(r.extractedAnswer).not.toContain("ANSWER");
    expect(OPENING.byBudget[FLIP_INDEX - 1].correct).toBe(false);
    expect(OPENING.byBudget.slice(FLIP_INDEX).every((r) => r.correct)).toBe(true);
    // The notebook's pick is still reachable, so nothing is hidden.
    expect(F3.clickableRowIds).toContain(F1.specimenId);
  });

  it("says where the dial stops biting instead of leaving dead travel", () => {
    render(<Page6 />);
    const natural = OPENING.byBudget.find((r) => !r.forced)!;
    expect(body()).toContain(`runs to ${natural.ownTokens} tokens`);
    expect(body()).toContain(`${natural.budget} and up are the same chain`);
  });

  it("prints the committed answer as maths, not as the LaTeX we spliced", () => {
    render(<Page6 />);
    expect(body()).not.toContain("\\boxed{ANSWER");
    expect(body()).toContain(`Final answer: ${tidyMath(OPENING.byBudget[0].extractedAnswer)}`);
  });

  it("carries the inset as a reliability comparison, not an overshoot one", () => {
    render(<Page6 />);
    // The measured finding is that a request misses the line on a quarter of
    // items while the cap misses on none. A caption claiming the soft arm
    // overspends would be describing the expectation, not the run.
    expect(body()).toContain(`${pct(F1.inset.soft.over_budget_rate)} over`);
    expect(body()).toContain(`${pct(F1.inset.hard.over_budget_rate)} over`);
    expect(F1.inset.hard.over_budget_rate).toBe(0);
    expect(body()).toContain("A prompt is a preference, not a cap.");
  });
});

describe("Page 6, figure 2: the same dial, every problem", () => {
  it("reads out the primary curve at whatever budget the dial holds", () => {
    render(<Page6 />);
    for (const [i, b] of B.entries()) {
      drag(i);
      const p = F2.primary.points[i];
      expect(body()).toContain(`at ${b} tokens`);
      expect(body()).toContain(`${p.n_correct}`);
      expect(body()).toContain(p.total_tokens.toLocaleString("en-US"));
    }
  });

  it("prints the procedure, which is what makes the figure re-derivable", () => {
    render(<Page6 />);
    expect(body()).toContain(PAGE6.procedure);
  });

  it("names every checkpoint but claims shape rather than level", () => {
    render(<Page6 />);
    for (const c of F2.curves) {
      expect(body()).toContain(c.label.replace("Qwen2.5-", "").replace("-Instruct", ""));
    }
    expect(body()).toContain("the shape is the part that is not about any of these checkpoints");
    expect(body()).toContain("nothing here is a statement about scale");
  });

  it("attributes budget forcing with no number of theirs attached", () => {
    render(<Page6 />);
    expect(body()).toContain("Muennighoff et al. 2025");
    expect(body()).toContain("Every number on this page is ours");
    // The retired page redrew an AIME24 curve for a 32B checkpoint. Nothing on
    // this page may carry a reported number again.
    expect(body()).not.toContain("AIME");
    expect(body()).not.toMatch(/s1-32B/);
  });
});

describe("Page 6, figure 3: not every problem costs the same", () => {
  it("names the never-flipping band as this grid's limit, never as unsolvable", () => {
    render(<Page6 />);
    expect(body()).toContain(`${F3.neverFlipCount} of ${F3.items.length}`);
    expect(body()).toContain("no budget in this grid reaches");
    expect(body()).toContain("The dial runs out before they do.");
    // The word appears once, inside its own disclaimer, and nowhere else.
    expect(body()).toContain("never a claim that those problems are unsolvable");
    expect(body().match(/unsolvable/g)).toHaveLength(1);
  });

  it("loads a bundled problem into figure 1 when its row is picked", () => {
    render(<Page6 />);
    const never = F1.rows.find((r) => r.firstCorrectBudget === null)!;
    // Four bundled rows never flip, so a button is named by its place in the
    // strip and its subject as well as by its flip point.
    const place = F3.items.findIndex((d) => d.problem_id === never.problemId) + 1;
    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(`row ${place} .* flips at never`, "i") }),
    );
    expect(screen.getByText(tidyMath(never.question))).toBeInTheDocument();
    // Take it to the top of the grid: the chain gets longer, the verdict does not move.
    drag(B.length - 1);
    expect(body()).toContain("✗ graded wrong");
    expect(body()).toContain(`of ${TOP} tokens thought`);
  });

  it("reports the regressions rather than implying a flip is permanent", () => {
    render(<Page6 />);
    expect(body()).toContain(`solved, then wrong again · ${F3.nRegressions} problems`);
  });
});

describe("Page 6, figure 4: refuse to let it stop", () => {
  it("draws the extension arm and reports it as redistribution, not a gain", () => {
    render(<Page6 />);
    const fw = PAGE6.figureWait!;
    expect(fw).not.toBeNull();
    expect(body()).toContain("The other direction: refuse to let it stop");
    for (const c of fw.curves) {
      expect(body()).toContain(c.label.replace("Qwen2.5-", "").replace("-Instruct", ""));
    }
    expect(body()).toContain("redistributes rather than adds");
    // Churn is the column that makes a flat line readable; without it the two
    // very different nulls are indistinguishable.
    expect(body()).toContain("answers moved");
    const last = fw.curves[0].points[fw.curves[0].points.length - 1];
    expect(body()).toContain(pct(last.churn));
  });

  it("never claims the injections help, because on this run they did not", () => {
    const fw = PAGE6.figureWait!;
    for (const c of fw.curves) {
      const gain = (c.points[c.points.length - 1].accuracy - c.points[0].accuracy) * 100;
      expect(gain).toBeLessThan(2);
      expect(c.paired[c.paired.length - 1].p).toBeGreaterThan(0.05);
    }
    render(<Page6 />);
    expect(body()).not.toMatch(/thinking longer (?:works|helps)/i);
  });

  it("ties the two arms together: k=0 reproduces the uncapped sweep", () => {
    const [same, of] = PAGE6.figureWait!.integrity.k0_matches_uncapped;
    expect(of).toBeGreaterThan(0);
    expect(same).toBe(of);
  });
});

describe("Page 6: provenance and the claims it is allowed to make", () => {
  it("names the run rather than flagging an authored demo", () => {
    render(<Page6 />);
    expect(body()).toContain("MATH-500 levels 4 and 5");
    expect(body()).toContain(PAGE6.manifest.run_id);
    expect(body()).toContain("greedy, budget forced at the cap");
    // Both retired chips: the demo is measured, and the axis is tokens because
    // we ran a tokenizer.
    expect(body()).not.toContain("written for this page, no live model");
    expect(body()).not.toContain("counts words, not tokens");
  });

  it("offers the notebook, the harness and the traces as one download", () => {
    render(<Page6 />);
    const link = screen.getByRole("link", { name: /download the notebook/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-06-thinking-longer.zip");
  });

  it("states the dip as one problem instead of dressing it as a finding", () => {
    render(<Page6 />);
    const last = F2.primary.gains[F2.primary.gains.length - 1];
    expect(last.gain_pts).toBeLessThan(0);
    expect(body()).toContain("too small to read either way");
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced: visible copy uses commas, colons or
    // semicolons instead, and ranges are spelled out. This covers aria-labels
    // and chart titles too, which screen readers speak.
    const { container } = render(<Page6 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });

  it("states provenance as a colophon rather than as a row of pill chips", () => {
    const { container } = render(<Page6 />);
    // The specific tell the author flagged on page 5: a filled bordered card
    // holding rounded chips. The colophon is hairlines and text, and the
    // download is the only lit element in it.
    const colophon = container.querySelector(".border-y")!;
    expect(colophon.querySelectorAll(".rounded-full").length).toBe(0);
    expect(colophon.className).not.toMatch(/bg-surface/);
    expect(colophon.querySelectorAll("a").length).toBe(1);
    expect(screen.getByRole("link", { name: /download the notebook/i })).toBeInTheDocument();
  });

  it("hands off to page 7 by splitting the same budget", () => {
    render(<Page6 />);
    const h = PAGE6.handoff;
    expect(body()).toContain(`${h.chains_at_min_budget} chains of ${h.min_budget}`);
    expect(body()).toContain(`what ${h.chains_at_min_budget} voters at ${pct(h.accuracy_at_min)} each are worth`);
  });

  it("carries page 5's endpoints when the run had them beside it", () => {
    render(<Page6 />);
    const e = PAGE6.handoff.page_5_endpoints;
    // The overlay is null when the generating run had no page 5 artifact on disk.
    // The seam sentence stays either way; only the two numbers are conditional.
    expect(body()).toContain("One measurement with page 5, not two.");
    if (e) {
      expect(body()).toContain(`${e.suppressed_tokens} tokens`);
      expect(body()).toContain(pct(e.unconstrained));
    }
  });
});
