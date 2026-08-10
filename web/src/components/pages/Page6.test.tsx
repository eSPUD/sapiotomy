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
import { PAGE6, WAIT_TABLE, pLabel, pct, rowById, tidyMath, traceZones } from "@/lib/page06";

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

// Three figures, three dials, and no two of them are the same object. Figure 1
// keeps a stop per budget, since there are five of them and a slide would be a
// fiction; figures 2 and 3 each carry a budget LINE on the chart, which is the
// control, and each answers to the keyboard as a slider.
const stops = () => screen.getAllByRole("radio", { name: /tokens$/ });
const stopFor = (i: number) => screen.getAllByRole("radio", { name: `${B[i]} tokens` });
const curveLine = () => screen.getByRole("slider", { name: /population curve/i });
const stripLine = () => screen.getByRole("slider", { name: /chain lengths/i });
const drag = (i: number) => fireEvent.click(stopFor(i)[0]);
/** Walk a budget line to a stop the way a keyboard reader would. */
const walk = (handle: HTMLElement, i: number) => {
  fireEvent.keyDown(handle, { key: "Home" });
  for (let k = 0; k < i; k++) fireEvent.keyDown(handle, { key: "ArrowRight" });
};

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
    // It used to promise that this dial drove the next two figures, which it
    // did, off screen and without saying so. Each figure holds its own now and
    // the sentence says that instead.
    expect(body()).not.toContain("The same dial drives the next two figures.");
    expect(body()).toContain("nothing you do here moves anything below");
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
    // The capped arm cannot overrun its own cap, and it was measured at 512
    // against the request arm's 2048, so the line may not score one against the
    // other. It states what the cap is; only the request arm reports a rate.
    expect(body()).not.toContain("overran on none");
    expect(body()).toContain("where the number holds because generation stops there");
    expect(body()).not.toContain(`asking for ${F1.inset.nominal_budget} tokens in the prompt`);
    expect(body()).not.toContain("A prompt is a preference, not a cap.");
  });
});

describe("Page 6, figure 2: the same dial, every problem", () => {
  it("reads out the primary curve at whatever budget the dial holds", () => {
    render(<Page6 />);
    for (const [i, b] of B.entries()) {
      walk(curveLine(), i);
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
      `${F3.neverFlipFinishedCount} of these problems did not run out of room, they ran out of ideas`,
    );
    expect(body()).toContain(`a median of ${F3.medianLengthNever} tokens`);
    // Only chains still running when the cap arrived are censored, and their
    // length is a floor rather than a value.
    expect(F3.censoredCount).toBe(F3.items.filter((d) => d.truncated_at_max).length);
    // The count is an intersection, not a subtraction across two populations:
    // one censored chain is solved (at 1024), so never-solved minus censored
    // undercounts by one and a reader counting squares finds the difference.
    expect(F3.neverFlipFinishedCount).toBe(
      F3.items.filter((d) => !d.correct_by_budget.some(Boolean) && !d.truncated_at_max).length,
    );
    expect(F3.neverFlipFinishedCount).toBe(F3.neverFlipCount - F3.censoredCount + 1);
    // The quoted median is a measured length, so the floors are not averaged in:
    // it is the lower median of the never-solved chains that stopped on their own.
    const measured = F3.items
      .filter((d) => !d.correct_by_budget.some(Boolean) && !d.truncated_at_max)
      .map((d) => d.tokens_at_max)
      .sort((a, b) => a - b);
    expect(F3.medianLengthNever).toBe(measured[Math.floor((measured.length - 1) / 2)]);
    expect(measured).toHaveLength(F3.neverFlipFinishedCount);
    expect(body()).toContain(`still running at ${TOP}, so its length is a floor`);
  });

  // The strip colours every square, gutter included, by whether the problem is
  // ever solved. One censored chain is, so the legend entry for the gutter has
  // to be the dash and not the never-solved fill, or a reader matching swatch to
  // gutter finds a colour the legend does not name.
  it("legends the censored gutter by its dash, not by a fill it does not all share", () => {
    render(<Page6 />);
    const censored = F3.items.filter((d) => d.truncated_at_max);
    expect(censored.some((d) => d.correct_by_budget.some(Boolean))).toBe(true);
    const strip = screen.getByLabelText("The chain-length distribution");
    const swatch = strip.querySelector("span.h-3.w-3.border-dashed");
    expect(swatch).not.toBeNull();
    expect(swatch!.className).not.toContain("bg-wrong");
    expect(swatch!.className).not.toContain("bg-compute");
  });

  it("names the never-solved band as this grid's limit, never as unsolvable", () => {
    render(<Page6 />);
    // The count lives in figure 3's own legend now that the section-5 pill that
    // restated it is gone.
    expect(body()).toContain(`never solved (${F3.neverFlipCount})`);
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
      walk(stripLine(), i);
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

  /**
   * Two pictures used to carry this step and neither could say the finding.
   * Page 5's paired grid put a hundred squares on screen whose ARRANGEMENT is
   * not data, so nineteen lit ones had to be counted and trusted; the three
   * accuracy lines were flat, which is a drawing of nothing happening. The
   * finding is a swap, so the figure is a crossing, and the counts are the
   * widths of the two bands that cross.
   */
  it("leads with the crossing rather than a field of squares", () => {
    render(<Page6 />);
    const w = WAIT_TABLE!;
    expect(w).not.toBeNull();
    const arm = screen.getByLabelText("The extension arm");
    // The legend names the direction each band crosses in, not a verdict on it.
    expect(arm.textContent).toContain(
      `wrong, then right once it could not stop (${w.table.afterOnly})`,
    );
    expect(arm.textContent).toContain(`right, then wrong (${w.table.beforeOnly})`);
    // Four bands, four legend entries: a problem right at both ends keeps the
    // tint it has at both ends, so the legend may not fold the concordant two
    // into one grey swatch.
    expect(arm.textContent).toContain(`right either way (${w.table.both})`);
    expect(arm.textContent).toContain(`wrong either way (${w.table.neither})`);
    expect(arm.textContent).toContain(
      `${w.table.afterOnly} answers turned from wrong to right against ${w.table.beforeOnly} that turned from right to wrong`,
    );
    expect(arm.textContent).toContain("Both crossings are thick and they cancel");

    // The crossing is drawn from the notebook's own paired counts, and the two
    // concordant bands follow from them by arithmetic rather than by a second
    // measurement: the four bands are the item set.
    expect(w.table.both + w.table.neither + w.table.afterOnly + w.table.beforeOnly).toBe(w.table.n);

    // The retired grid and the retired lines, both gone.
    expect(arm.querySelector(".grid-cols-10")).toBeNull();
    expect(arm.textContent).not.toContain("and the net, on all three checkpoints");
  });

  // The three flat lines are replaced by the widths of the two things that
  // crossed, one row per checkpoint, on one scale.
  it("draws the same crossing for every checkpoint, wrecked against rescued", () => {
    render(<Page6 />);
    const arm = screen.getByLabelText("The extension arm");
    expect(arm.textContent).toContain("and the same crossing on all three checkpoints");
    for (const c of PAGE6.figureWait!.curves) {
      const p = c.paired[c.paired.length - 1];
      const first = c.points[0];
      const last = c.points[c.points.length - 1];
      expect(arm.textContent).toContain(
        `${pct(first.accuracy)} → ${pct(last.accuracy)} · ${pct(last.churn)} of answers moved · ×${(
          last.mean_tokens / first.mean_tokens
        ).toFixed(1)} the tokens`,
      );
      expect(p.fixed).toBeGreaterThan(0);
      expect(p.broken).toBeGreaterThan(0);
    }
    expect(arm.textContent).toContain(
      "against the same problem at zero injections, so they are paired",
    );
  });

  // Churn counts every answer that moved; the crossing draws only the ones that
  // changed the verdict. A reader comparing 30% against two bands of 9 and 10
  // must not find the figure and the readout disagreeing.
  it("reconciles the churn readout with the width of the crossings", () => {
    render(<Page6 />);
    const w = WAIT_TABLE!;
    expect(w.movedWithoutChangingTheVerdict).toBe(
      w.moved - w.table.afterOnly - w.table.beforeOnly,
    );
    expect(body()).toContain(
      `a further ${w.movedWithoutChangingTheVerdict} swapped one wrong answer for another`,
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
    // Three unresolved crossings are a null, and the step may not read one as a
    // mechanism. The p-values ride in the ledger, where the other vitals are.
    expect(body()).toContain("Not one of the three crossings resolves");
    expect(body()).not.toMatch(/was not holding back/i);
    for (const c of fw.curves) {
      expect(screen.getByLabelText("The extension arm").textContent).toContain(
        pLabel(c.paired[c.paired.length - 1].p),
      );
    }
    // "Roughly double" is wrong for two of the three, so the cost is a range.
    expect(body()).not.toContain("Roughly double the tokens");
    const multiples = fw.curves.map(
      (c) => c.points[c.points.length - 1].mean_tokens / c.points[0].mean_tokens,
    );
    expect(body()).toContain(
      `${Math.min(...multiples).toFixed(1)} to ${Math.max(...multiples).toFixed(1)} times the tokens`,
    );
  });

  it("ties the two arms together: k=0 reproduces the uncapped sweep", () => {
    const [same, of] = PAGE6.figureWait!.integrity.k0_matches_uncapped;
    expect(of).toBeGreaterThan(0);
    expect(same).toBe(of);
  });
});

describe("Page 6: one dial per figure, and no dial that reaches past its own", () => {
  /**
   * These three figures used to share one budget, on the argument that they are
   * one measurement seen three ways. What that bought the reader was a control
   * whose effect was off screen in both directions: the stop row in step 2 also
   * redrew the trace a screen and a half above it, and the line in step 3 also
   * redrew that trace two screens above IT. This block is here to stop them
   * being merged again.
   */
  it("gives figure 1 the only stop row, and figures 2 and 3 a line each", () => {
    render(<Page6 />);
    expect(stops()).toHaveLength(B.length);
    for (const [i] of B.entries()) expect(stopFor(i)).toHaveLength(1);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(curveLine()).toBeInTheDocument();
    expect(stripLine()).toBeInTheDocument();
    expect(B.every((b) => body().includes(String(b)))).toBe(true);
  });

  it("moves one figure's budget without moving another's", () => {
    render(<Page6 />);
    // Figure 2 to the top of the grid; figure 1 and figure 3 stay where they were.
    fireEvent.keyDown(curveLine(), { key: "End" });
    expect(curveLine()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);
    expect(stripLine()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);
    expect(stopFor(0)[0]).toBeChecked();
    expect(body()).toContain(`${OPENING.byBudget[0].ownTokens} of ${B[0]} tokens thought`);

    // And figure 1 to its flip, with figure 2 left at the top.
    drag(FLIP_INDEX);
    expect(curveLine()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);
    expect(stripLine()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);
  });

  // Each line IS its figure's control, so it has to answer to the keyboard as
  // well as to a pointer, and it has to stop at both ends of the grid.
  it.each([
    ["the population curve", curveLine],
    ["the chain lengths", stripLine],
  ])("moves %s line with the arrow keys, and stops at both ends", (_name, handle) => {
    render(<Page6 />);
    fireEvent.keyDown(handle(), { key: "ArrowLeft" });
    expect(handle()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);

    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(handle()).toHaveAttribute("aria-valuetext", `${B[1]} tokens`);

    fireEvent.keyDown(handle(), { key: "End" });
    expect(handle()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);
    fireEvent.keyDown(handle(), { key: "ArrowRight" });
    expect(handle()).toHaveAttribute("aria-valuetext", `${TOP} tokens`);

    fireEvent.keyDown(handle(), { key: "Home" });
    expect(handle()).toHaveAttribute("aria-valuetext", `${B[0]} tokens`);
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
  it("names the instrument where it is used, not in a top colophon, and never flags an authored demo", () => {
    render(<Page6 />);
    // The run id and the "levels 4 and 5, budget forced at the cap" colophon
    // that used to head the page are jargon the notebook owns; the page names
    // the instrument where it is applied, in figure 1's own caption.
    expect(body()).toContain("Qwen2.5-3B-Instruct");
    expect(body()).toContain("greedy");
    expect(body()).toContain("MATH-500");
    expect(body()).not.toContain(PAGE6.manifest.run_id);
    // Both retired chips: the demo is measured, and the axis is tokens because
    // we ran a tokenizer.
    expect(body()).not.toContain("written for this page, no live model");
    expect(body()).not.toContain("counts words, not tokens");
  });

  it("offers the notebook, the harness and the traces as one download", () => {
    render(<Page6 />);
    const link = screen.getByRole("link", { name: /notebook, harness/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-06-thinking-longer.zip");
  });

  it("states the dip as one problem instead of dressing it as a finding", () => {
    render(<Page6 />);
    const last = F2.primary.gains[F2.primary.gains.length - 1];
    expect(last.gain_pts).toBeLessThan(0);
    // Figure 2's closing line reads the dip as a single problem rather than
    // dressing it as an overthinking finding (page 17 owns that).
    expect(body()).toContain("which is one problem out of");
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

  it("puts the notebook download at the top beside the title, with no run colophon", () => {
    const { container } = render(<Page6 />);
    // The hairline colophon that used to head the page, naming the run, is gone:
    // its jargon belongs to the notebook and is left to it.
    expect(container.querySelector(".border-y")).toBeNull();
    expect(body()).not.toContain(PAGE6.manifest.run_id);

    // The download shares the top line with the title rather than sitting in a
    // footer: it is a sibling of the <h1>'s column, both inside one header row.
    const heading = screen.getByRole("heading", { level: 1 });
    const download = screen.getByRole("link", { name: /notebook, harness/i });
    const headerRow = heading.closest("div")!.parentElement!;
    expect(headerRow).toContainElement(download);

    // The reference still lives in the right-hand References sidenote.
    const refs = screen.getByText("References").closest("aside")!;
    expect(within(refs).getByRole("link", { name: /Muennighoff et al. 2025/ })).toBeInTheDocument();
  });

  /**
   * References is a sidenote to step 1, which is the step that carries the
   * citation, so it shares step 1's cell. It used to sit in a grid row of its
   * own under an EMPTY left cell, which cost four hundred pixels of blank page
   * between step 1's closing line and step 2's heading and left the citation
   * floating in the margin beside nothing at all.
   */
  it("keeps References beside step 1 rather than in a row of its own", () => {
    const { container } = render(<Page6 />);
    const tryIt = screen.getAllByText("Try it")[0].closest("aside")!;
    const refs = screen.getByText("References").closest("aside")!;
    expect(refs.parentElement).toBe(tryIt.parentElement);

    // And no spacer cell is left behind holding the row open.
    const spacers = Array.from(container.querySelectorAll('div[aria-hidden="true"]')).filter(
      (d) => d.children.length === 0 && !d.textContent,
    );
    expect(spacers.length).toBeLessThanOrEqual(1);
  });

  it("hands off to page 7 by splitting the same budget", () => {
    render(<Page6 />);
    const h = PAGE6.handoff;
    expect(body()).toContain(`${h.chains_at_min_budget} chains of ${h.min_budget}`);
    expect(body()).toContain(`what ${h.chains_at_min_budget} voters at ${pct(h.accuracy_at_min)} each are worth`);
  });
});
