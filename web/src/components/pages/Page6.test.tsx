import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

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
import { PAGE6, WAIT_TABLE, pct, rowById, tidyMath, traceZones } from "@/lib/page06";

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
// One budget, two instruments. Figures 1 and 2 carry a stop per budget, since
// there are five of them and a slide would be a fiction; figure 3's budget line
// IS its control, and answers to the keyboard as a slider.
const stops = () => screen.getAllByRole("radio", { name: /tokens$/ });
const stopFor = (i: number) => screen.getAllByRole("radio", { name: `${B[i]} tokens` });
const lineHandle = () => screen.getByRole("slider", { name: /token budget/i });
const drag = (i: number) => fireEvent.click(stopFor(i)[0]);

describe("Page 6, figure 1: cut it off, make it answer", () => {
  it("opens on the specimen at the smallest budget, cut and forced", () => {
    render(<Page6 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thinking Longer");
    expect(screen.getByText(tidyMath(OPENING.question))).toBeInTheDocument();
    for (const s of stopFor(0)) expect(s).toBeChecked();
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

  // The figure opens on a sentence naming what the dial IS and what happens at
  // the cap, because a starved model still producing a gradeable answer is
  // otherwise inexplicable. The stem itself is shown where it is applied, in
  // the trace's tinted band, rather than pasted into the prose as a raw string.
  it("explains the forcing before the reader touches the dial", () => {
    render(<Page6 />);
    expect(body()).toContain("max_new_tokens");
    expect(body()).toContain("start the answer line for it");
    expect(body()).toContain(`${PAGE6.manifest.forcing.answer_allowance} more tokens`);
    expect(body()).toContain("The same dial drives the next two figures.");
  });

  // The listing face, as page 5 settled it: the question and the trace are what
  // a machine read and wrote, and the broadsheet serif is unreadable at length.
  it("sets the question and the trace in mono", () => {
    const { container } = render(<Page6 />);
    const q = container.querySelector("p.font-code");
    expect(q?.textContent).toBe(tidyMath(OPENING.question));
  });

  // The inset was a two-bar chart with one bar at zero, defending a method
  // choice nobody had questioned, for a third of the figure's height. The
  // reliability fact survives as one line in the margin. The soft arm asked for
  // brevity in words, never for a token count, so the line may not say it did.
  it("keeps the cap-versus-request fact without spending a chart on it", () => {
    render(<Page6 />);
    expect(body()).toContain(
      `ran past ${F1.inset.nominal_budget} tokens on ${pct(F1.inset.soft.over_budget_rate)} of items`,
    );
    expect(F1.inset.hard.over_budget_rate).toBe(0);
    expect(body()).toContain("overran on none");
    expect(body()).not.toContain(`asking for ${F1.inset.nominal_budget} tokens in the prompt`);
    expect(body()).not.toContain("A prompt is a preference, not a cap.");
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

  // The heights bar is load-bearing and cannot go in the notebook, because the
  // figure invites the comparison on screen. It moved from the retired footer
  // into the margin beside the curve it qualifies.
  it("names every checkpoint but claims shape rather than level", () => {
    render(<Page6 />);
    for (const c of F2.curves) {
      expect(body()).toContain(c.label.replace("Qwen2.5-", "").replace("-Instruct", ""));
    }
    expect(body()).toContain("the shape is the part that is not about any of these checkpoints");
    expect(body()).toContain("Read the shape rather than the heights");
    expect(body()).toContain("a level comparison is barred twice over");
  });

  it("attributes budget forcing with no number of theirs attached", () => {
    render(<Page6 />);
    expect(screen.getByRole("link", { name: /Muennighoff et al. 2025/ })).toBeInTheDocument();
    // The retired page redrew an AIME24 curve for a 32B checkpoint. Nothing on
    // this page may carry a reported number again.
    expect(body()).not.toContain("AIME");
    expect(body()).not.toMatch(/s1-32B/);
  });
});

describe("Page 6, figure 3: it stops mattering before you run out of dial", () => {
  // The claim the rebuilt figure exists to make, and the one the old flip-point
  // staircase could not: these chains were not cut short, they finished.
  it("says the never-solved ran out of ideas rather than out of room", () => {
    render(<Page6 />);
    expect(body()).toContain(
      `${F3.neverFlipCount - F3.censoredCount} of these problems did not run out of room, they ran out of ideas`,
    );
    expect(body()).toContain(`a median of ${F3.medianLengthNever} tokens`);
    // Only chains still running when the cap arrived are censored, and their
    // length is a floor rather than a value.
    expect(F3.censoredCount).toBe(F3.items.filter((d) => d.truncated_at_max).length);
    expect(body()).toContain(`still running at ${TOP}, so its length is a floor`);
  });

  it("names the never-solved band as this grid's limit, never as unsolvable", () => {
    render(<Page6 />);
    expect(body()).toContain(`${F3.neverFlipCount} of ${F3.items.length}`);
    // The word appears once, inside its own disclaimer, and nowhere else.
    expect(body()).toContain("never a claim that those problems are unsolvable");
    expect(body().match(/unsolvable/g)).toHaveLength(1);
    expect(body()).toContain("Page 7 changes the decoding");
  });

  // The figure places each problem by a MEASURED quantity, so the dial line
  // separates finished from still-being-cut and its two readouts have to track
  // the notebook's own truncation series.
  it("reads the truncation series off the dial as it moves", () => {
    render(<Page6 />);
    for (const [i, b] of B.entries()) {
      drag(i);
      const inside = F3.items.filter((d) => d.tokens_at_max <= b).length;
      expect(body()).toContain(`${inside} finished on their own`);
      expect(body()).toContain(`${F3.items.length - inside} still being cut`);
      // the same fact figure 2 reports as a truncation rate
      expect(F3.items.length - inside).toBe(
        Math.round(F2.primary.points[i].truncation_rate * F3.items.length),
      );
    }
  });

  // Buttons name what each problem demonstrates rather than indexing a sort the
  // reader cannot see, which is what the retired staircase's buttons did.
  it("loads a bundled problem into figure 1, labelled by what it shows", () => {
    render(<Page6 />);
    const never = F1.rows.find((r) => r.firstCorrectBudget === null)!;
    const d = F3.items.find((x) => x.problem_id === never.problemId)!;
    const label = d.truncated_at_max
      ? /cut off at every budget/i
      : new RegExp(`finished at ${d.tokens_at_max}, still wrong`, "i");
    fireEvent.click(screen.getByRole("button", { name: label }));
    expect(screen.getByText(tidyMath(never.question))).toBeInTheDocument();
    // Take it to the top of the grid: the chain gets longer, the verdict does not move.
    drag(B.length - 1);
    expect(body()).toContain("✗ graded wrong");
    expect(body()).toContain(`of ${TOP} tokens thought`);
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

  // The step used to open on three nearly flat accuracy lines, which reads as
  // "nothing happened" when the finding is that a third of the answers moved and none
  // of it helped. It opens on page 5's paired grid now, with the lines as the inset.
  it("leads with what moved, in page 5's paired-flip vocabulary", () => {
    render(<Page6 />);
    const w = WAIT_TABLE!;
    expect(w).not.toBeNull();
    const arm = screen.getByLabelText("The extension arm");
    // The grid is the two discordant blocks, and both counts are in the legend.
    expect(arm.textContent).toContain(`fixed by being made to keep going (${w.table.afterOnly})`);
    expect(arm.textContent).toContain(`broken by it (${w.table.beforeOnly})`);
    expect(arm.textContent).toContain(
      `${w.table.afterOnly} rescued against ${w.table.beforeOnly} wrecked`,
    );
    // 100 squares, one per problem, from the shared paired table.
    expect(w.table.cells).toHaveLength(w.table.n);
    // And the accuracy lines are demoted to an inset that says so.
    expect(arm.textContent).toContain("and the net, on all three checkpoints");
  });

  // Churn counts every answer that moved; the grid lights only the ones that changed
  // the verdict. A reader comparing 30% against 19 lit squares must not find the
  // figure and the readout disagreeing.
  it("reconciles the churn readout with the number of lit squares", () => {
    render(<Page6 />);
    const w = WAIT_TABLE!;
    expect(w.movedWithoutChangingTheVerdict).toBe(
      w.moved - w.table.afterOnly - w.table.beforeOnly,
    );
    expect(body()).toContain(
      `including ${w.movedWithoutChangingTheVerdict} that swapped one wrong answer for another`,
    );
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

describe("Page 6: one budget, reachable from every figure it drives", () => {
  // The control used to live in figure 1 alone, a screen or more above the two
  // other figures that answer to it, while their prose told the reader to drag
  // something off screen.
  it("gives figures 1 and 2 a stop per budget, not a slide", () => {
    render(<Page6 />);
    // Two figures, one stop each per budget, and nothing else claims the role.
    expect(stops()).toHaveLength(B.length * 2);
    for (const [i, b] of B.entries()) expect(stopFor(i)).toHaveLength(2);
    expect(B.every((b) => body().includes(String(b)))).toBe(true);
  });

  it("keeps both stop rows and the strip's line on one budget", () => {
    render(<Page6 />);
    for (const [i, b] of B.entries()) {
      // Drive the copy in figure 2, the one that used to have no control.
      fireEvent.click(stopFor(i)[1]);
      for (const s of stopFor(i)) expect(s).toBeChecked();
      expect(lineHandle()).toHaveAttribute("aria-valuetext", `${b} tokens`);
    }
  });

  // Figure 3 carries no widget: its budget line is the control, so it has to
  // answer to the keyboard as well as to a pointer.
  it("moves the strip's line with the arrow keys, and stops at both ends", () => {
    render(<Page6 />);
    drag(0);
    fireEvent.keyDown(lineHandle(), { key: "ArrowLeft" });
    expect(lineHandle()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);

    fireEvent.keyDown(lineHandle(), { key: "ArrowRight" });
    expect(lineHandle()).toHaveAttribute("aria-valuetext", `${B[1]} tokens`);
    for (const s of stopFor(1)) expect(s).toBeChecked();

    fireEvent.keyDown(lineHandle(), { key: "End" });
    expect(lineHandle()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);
    fireEvent.keyDown(lineHandle(), { key: "ArrowRight" });
    expect(lineHandle()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);

    fireEvent.keyDown(lineHandle(), { key: "Home" });
    expect(lineHandle()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);
  });

  // The picker only ever changed figure 1, so it sat two screens from the thing
  // it moved. It is now inside figure 1's own panel.
  it("keeps the problem picker inside the figure it loads into", () => {
    render(<Page6 />);
    const picker = screen.getByRole("group", { name: /bundled problems/i });
    const figure1 = document.querySelector('section[aria-label="The truncation view"]');
    const figure3 = document.querySelector('section[aria-label="The chain-length distribution"]');
    expect(figure1).toContainElement(picker);
    expect(figure3).not.toContainElement(picker);
    expect(body()).not.toContain("load one into figure 1");
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
    // holding rounded chips. The colophon is hairlines and text only; the
    // download moved to the footer and the reference to a References sidenote.
    const colophon = container.querySelector(".border-y")!;
    expect(colophon.querySelectorAll(".rounded-full").length).toBe(0);
    expect(colophon.className).not.toMatch(/bg-surface/);
    expect(colophon.querySelectorAll("a").length).toBe(0);

    // The reference lives in the right-hand References sidenote, not the footer.
    const refs = screen.getByText("References").closest("aside")!;
    expect(within(refs).getByRole("link", { name: /Muennighoff et al. 2025/ })).toBeInTheDocument();

    // The footer keeps only the download link.
    const footer = screen
      .getByRole("link", { name: /download the notebook/i })
      .closest("div.border-t")!;
    expect(within(footer as HTMLElement).queryByRole("link", { name: /Muennighoff et al. 2025/ })).not.toBeInTheDocument();
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
    expect(body()).toContain("One measurement with page 5, not two");
    if (e) {
      expect(body()).toContain(`${e.suppressed_tokens} tokens`);
      expect(body()).toContain(pct(e.unconstrained));
    }
  });
});
