import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { PAGE17 } from "@/lib/page17";
import { Page15 } from "./Page15";

/**
 * Page 15's test file (this page was 17 until the 2026-08-10 cut; its data
 * loader keeps the old name). It was the only page in the deck without one, and
 * the absence was not free: two defects lived here precisely because nothing
 * read this page's text.
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

/**
 * Scope to a numbered step by its heading, never by `closest("section")` from a
 * control or a figure. Each step now wraps its figures in labelled <section>
 * regions of their own, as pages 5, 7 and 9 do, so climbing from a slider or a
 * chart lands inside the figure rather than on the step. Climbing from the
 * step's own <h2> cannot: the h2 is a child of the step and a sibling of every
 * figure in it.
 */
const step = (heading: RegExp) =>
  screen.getByRole("heading", { name: heading }).closest("section")!;

describe("Page 15 (when reasoning breaks) component", () => {
  it("prints Huang et al.'s Table 3 rows verbatim, both getting worse", () => {
    render(<Page15 />);
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
    render(<Page15 />);
    expect(screen.getByText(/no hints, no tools, just re-reading/i)).toBeInTheDocument();
    expect(screen.getByText(/Nothing new enters the system/i)).toBeInTheDocument();
  });

  // ---- step 2: measured, specimen-led, and fenced by its own controls ----

  it("bridges step 1 to step 2 on the trigger, not on the experiment", () => {
    render(<Page15 />);
    // One failure with two triggers: revision the reader asked for, then revision the
    // model performs unprompted when a chain left running overwrites an answer it had
    // already reached. Nothing new enters in either case, which is the shared hinge.
    const step2 = step(/Thinking too hard/i);
    expect(step2.textContent).toMatch(/Step 1 was a revision/i);
    expect(step2.textContent).toMatch(/you asked for/i);
    expect(step2.textContent).toMatch(/the model performs on its own/i);
    // They are still separate measurements: different models, benchmarks and
    // instruments. The old slider was called "extra passes" and modelled revision.
    // Nothing on the page may imply step 2 is step 1 run again.
    expect(screen.queryByRole("slider", { name: /revision|extra passes/i })).toBeNull();
  });

  it("titles the sections with the failure modes the page promises", () => {
    render(<Page15 />);
    // The subtitle sells self-correction, verifier reliability and overthinking. A
    // reader who cannot map those onto the sections cannot navigate the page.
    expect(screen.getByRole("heading", { name: /Fix your mistakes/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Thinking too hard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Scoring gone wrong/i })).toBeInTheDocument();
  });

  it("draws the losses page 6's curve nets out, on every rung", () => {
    render(<Page15 />);
    const fig = screen.getByRole("img", { name: /gained and lost at each doubling/i });
    expect(fig.getAttribute("aria-label")).toMatch(/Every rung loses answers/i);
    for (const rung of PAGE17.ledger.primary) expect(rung.lost).toBeGreaterThan(0);
  });

  it("blames the empty top rung on the axis rather than on the model", () => {
    render(<Page15 />);
    // Under greedy decoding a self-terminated chain is not rerun at a larger budget.
    // Without this the flat top reads as a measured plateau. The caption under the
    // ledger says which of the two it is, and the margin note beside it carries the
    // mechanism, so the two figures the slider drives stay next to each other.
    const step2 = step(/Thinking too hard/i);
    expect(step2.textContent).toMatch(/about the axis rather than about thinking/i);
    // The note is named for the thing in the figure it explains. It used to open on
    // what the axis cannot show in general, which was a claim about the experiment
    // rather than help reading the ledger, and that line is the notebook's now.
    const note = screen.getByText(/Why the top rung is empty/i).closest("aside")!;
    expect(note.textContent).toMatch(/it is the same generation/i);
    expect(note.textContent).toMatch(/The axis runs out before the model does/i);
  });

  it("walks the specimen from a forced commit to its own wrong ending", () => {
    render(<Page15 />);
    const first = PAGE17.specimen.rightWhenCutAt[0];
    setBudget(PAGE17.run.budgets.indexOf(first));
    expect(screen.getByText(new RegExp(`cut at ${first} tokens`, "i"))).toBeInTheDocument();
    expect(screen.getByText(/answered.*right/i)).toBeInTheDocument();

    setBudget(PAGE17.run.budgets.length - 1);
    expect(screen.getByText(/its own ending/i)).toBeInTheDocument();
    expect(screen.getByText(/answered.*wrong/i)).toBeInTheDocument();
  });

  it("lights the step that costs it, and says why that step is wrong", () => {
    render(<Page15 />);
    setBudget(PAGE17.run.budgets.length - 1);
    expect(screen.getByText(new RegExp(PAGE17.specimen.zones.why, "i"))).toBeInTheDocument();
  });

  it("states how much of the chain it folded away", () => {
    render(<Page15 />);
    setBudget(PAGE17.run.budgets.length - 1);
    // An elision that does not say its size lets a cropped chain read as a tidy one.
    expect(screen.getAllByText(/more characters of working/i).length).toBeGreaterThan(0);
  });

  it("keeps the reader-facing control in the body and the apparatus off the page", () => {
    render(<Page15 />);
    // "Not a strategy" guards the reader's takeaway: without it step 2 reads as
    // "cut your budget at 512 and win", which is a technique that does not exist.
    // It stays. The other two defended the specimen's reading against a skeptic,
    // which is apparatus, and a margin note may only help a reader read the figure
    // beside it, so they went to the notebook on 2026-08-10.
    const step2 = step(/Thinking too hard/i);
    expect(step2.textContent).toMatch(/Not a strategy/i);
    expect(screen.queryByText(/Not a truncated proof/i)).toBeNull();
    expect(screen.queryByText(/Not the model already knowing/i)).toBeNull();
  });

  it("pins the three controls to claims the run came back false on", () => {
    // These are the assertions that stop the specimen becoming a strategy the reader
    // takes away. Each is false in the shipped run. The first two no longer appear in
    // the copy, but the specimen's reading still rests on them, so they stay pinned
    // here: a rerun that flips one needs new copy, not a green suite.
    expect(PAGE17.controls.concludedWhenCut.cameFromFinishedReasoning).toBe(false);
    expect(PAGE17.controls.isItARule.stoppingEarlyIsAStrategy).toBe(false);
    expect(PAGE17.controls.isItARule.cutPointsBeatResampling).toBe(false);
    render(<Page15 />);
    expect(screen.getByText(/coverage without page 8's selector/i)).toBeInTheDocument();
  });

  it("makes its one aggregate claim about capability, not about budgets", () => {
    render(<Page15 />);
    expect(
      screen.getByText(/the better the model, the less of this it does/i),
    ).toBeInTheDocument();
    for (const m of PAGE17.affected.byModel) {
      expect(screen.getAllByText(String(m.rescued)).length).toBeGreaterThan(0);
    }
  });

  // ---- step 3: the verifier step, which is the deck's own measurement ----

  it("draws the temperature sweep, and names the knob that causes the decay", () => {
    render(<Page15 />);
    const fig = screen.getByRole("img", { name: /against sampling temperature/i });
    expect(fig).toBeInTheDocument();
    // The x axis has to name what it is, because the whole point is that the knob
    // belongs to page 8's method rather than to the judge.
    expect(screen.getByText(/the knob that buys candidate diversity/i)).toBeInTheDocument();
  });

  it("says the sweep holds candidate depth fixed, since reliability decays with N too", () => {
    render(<Page15 />);
    const fig = screen.getByRole("img", { name: /against sampling temperature/i });
    expect(fig.getAttribute("aria-label")).toMatch(
      new RegExp(`measured over ${PAGE17.reliability.depth} candidates`, "i"),
    );
    expect(
      screen.getByText(/Candidate depth is held at .* throughout/i),
    ).toBeInTheDocument();
  });

  /**
   * The dial is the page's answer to its own sentence, that reliability "is a reading
   * taken at a setting". Until it shipped, the page asserted that and then showed a
   * static chart, which is exactly the shape it accuses page 8 of. These assertions
   * keep the dial reading off the run, keep it honest that only four settings were
   * measured, and keep the one column where the trained scorer TRAILS reachable,
   * because that column is the whole crossing.
   */
  const tempDial = () => screen.getByRole("slider", { name: /sampling temperature/i });
  const relFig = () => screen.getByRole("img", { name: /against sampling temperature/i });

  it("hands the reader the temperature knob the prose names", () => {
    render(<Page15 />);
    const dial = tempDial();
    expect(dial).toBeInTheDocument();
    // One stop per measured column, and no stops in between.
    expect(dial).toHaveAttribute("min", "0");
    expect(dial).toHaveAttribute("max", String(PAGE17.reliability.temperatures.length - 1));
    expect(screen.getByText(/does not interpolate, because nothing was measured between/i))
      .toBeInTheDocument();
  });

  it("opens on the column where the trained scorer is behind, which is the crossing", () => {
    render(<Page15 />);
    const rel = PAGE17.reliability;
    const others = rel.lines.filter((l) => !l.trained);
    const gapAt = (i: number) =>
      (rel.trained.points[i].reliability -
        Math.max(...others.map((o) => o.points[i].reliability))) *
      100;
    // The run must still cross, or the figure is built around something that is gone.
    expect(gapAt(0)).toBeLessThan(0);
    expect(gapAt(rel.temperatures.length - 1)).toBeGreaterThan(0);
    expect(tempDial()).toHaveValue("0");
    // Twice on purpose: once annotating the figure, once in the sentence under it.
    // If those two ever quote different numbers for the same column the page is
    // arguing with itself, so the count is asserted rather than the presence.
    const n = Math.abs(gapAt(0)).toFixed(0);
    const word = Math.abs(Number(n)) === 1 ? "point" : "points";
    expect(screen.getAllByText(new RegExp(`${n} ${word}\\s+behind`, "i"))).toHaveLength(2);
    // The cold column rounds to exactly one point on this run, so "1 points behind"
    // is reachable on first render rather than being a theoretical plural bug.
    expect(screen.queryByText(/\b1 points\b/)).not.toBeInTheDocument();
  });

  /**
   * At one column two selectors are exactly level for best-of-the-rest. Naming
   * only one of them would tell the reader a selector was uniquely best at a
   * setting where two were tied, which is the kind of quiet overstatement this
   * deck's provenance rules exist to prevent.
   */
  it("names every selector tied for best of the rest, not just the first found", () => {
    render(<Page15 />);
    const rel = PAGE17.reliability;
    const others = rel.lines.filter((l) => !l.trained);
    const tiedAt = rel.temperatures.map((t, i) => {
      const top = Math.max(...others.map((o) => o.points[i].reliability));
      return others.filter((o) => Math.abs(o.points[i].reliability - top) < 1e-9);
    });
    const tiedIx = tiedAt.findIndex((ls) => ls.length > 1);
    if (tiedIx < 0) return; // no tie on this run, nothing to hold
    fireEvent.change(tempDial(), { target: { value: String(tiedIx) } });
    const readout = screen.getByText(/tie for best of everything else at this setting/i)
      .parentElement!;
    for (const l of tiedAt[tiedIx]) expect(readout.textContent).toContain(l.label);
  });

  it("turns the deficit into a lead as the reader turns the dial up", () => {
    render(<Page15 />);
    const rel = PAGE17.reliability;
    const others = rel.lines.filter((l) => !l.trained);
    const hot = rel.temperatures.length - 1;
    const gapHot =
      (rel.trained.points[hot].reliability -
        Math.max(...others.map((o) => o.points[hot].reliability))) *
      100;
    fireEvent.change(tempDial(), { target: { value: String(hot) } });
    // Three, and the third is the point. Two are the dial's own readout (figure
    // annotation plus the sentence under it); the third is the page's standing
    // "it finishes N points clear" paragraph, which was written before the dial
    // existed. Driving the dial to the hot column must land on exactly the number
    // that paragraph already quotes, or the reader can produce a figure that
    // contradicts the prose beside it.
    expect(
      screen.getAllByText(new RegExp(`${gapHot.toFixed(0)} points\\s+clear`, "i")),
    ).toHaveLength(3);
    // The readout is not the only thing that moves: the figure's own description
    // has to follow the dial, or a screen-reader user gets a frozen chart.
    expect(relFig().getAttribute("aria-label")).toContain(
      `The dial is on temperature ${rel.temperatures[hot]}`,
    );
  });

  it("names what the trained scorer is being charged against, not just the gap", () => {
    render(<Page15 />);
    const rel = PAGE17.reliability;
    const others = rel.lines.filter((l) => !l.trained);
    const best = others.reduce((a, b) => (b.points[0].reliability > a.points[0].reliability ? b : a));
    expect(screen.getByText(/the best of everything else at this setting/i).textContent).toContain(
      best.label,
    );
  });

  it("makes the crossing the claim rather than any one column", () => {
    render(<Page15 />);
    // The crossing, stated as one: mid-pack at the cold end, clear at the hot end,
    // and clear because the others fell rather than because it rose.
    expect(screen.getByText(/mid-pack at the cold end/i)).toBeInTheDocument();
    expect(screen.getByText(/came down to meet it/i)).toBeInTheDocument();
    // The contrast the figure is built on: asked to judge against trained to score.
    const step3 = step(/Scoring gone wrong/i);
    expect(step3.textContent).toMatch(/a model asked to judge/i);
    expect(step3.textContent).toMatch(/trained to score/i);
  });

  // Step 3 carried a second beat until 2026-08-10: the sliver of a chain a checker
  // can adjudicate, the reward model's quality figures taken inside it, and the
  // selection null. Three of its four claims were page 9's own, restated a page
  // later. It went to page 9 and was cut from there the same day for length, so it
  // is out of the deck; Page9.test.tsx guards the other end. What must not happen
  // is a half-cut that leaves the page pointing at a figure it no longer draws.
  it("no longer argues the grader's audit surface, which left the deck", () => {
    render(<Page15 />);
    expect(screen.queryByRole("img", { name: /can adjudicate/i })).toBeNull();
    expect(screen.queryByText(/were\s+all measured in here/i)).toBeNull();
    expect(screen.queryByText(/second coordinate/i)).toBeNull();
    expect(screen.queryByText(/soundness of their working/i)).toBeNull();
    // And no orphaned pointer at a figure that is no longer here.
    expect(document.body.textContent).not.toMatch(/both figures/i);
  });

  // A margin note may only help a reader read the figure beside it. Anything else,
  // provenance, apparatus, a caveat about the experiment, is the notebook's. The
  // shape that rule enforces is length: one short paragraph. Reference notes are a
  // different thing and carry one entry per citation.
  it("keeps every margin note to one paragraph of help with the figure beside it", () => {
    const { container } = render(<Page15 />);
    for (const aside of Array.from(container.querySelectorAll("aside"))) {
      const kicker = aside.querySelector("p")?.textContent ?? "";
      if (/^references$/i.test(kicker)) continue;
      // The kicker is the first <p>; the note itself is whatever follows it.
      const body = Array.from(aside.querySelectorAll("p")).slice(1);
      expect(body.length).toBeLessThanOrEqual(1);
      const words = (body[0]?.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
      expect(words).toBeLessThanOrEqual(60);
    }
  });

  it("still lands step 4's calculator claim, now sourced to page 9", () => {
    render(<Page15 />);
    // The claim survives the move; only its antecedent changed. It used to read
    // "Step 3 is why that is not a platitude", and step 3 no longer establishes it.
    const claim = screen.getByText(/carry no closed-form numeric claim anywhere/i);
    expect(claim.textContent).toMatch(/Page 9 is why that is not a platitude/i);
    expect(claim.textContent).toContain(PAGE17.readable.nChainsUnreadable.toLocaleString());
  });

  it("no longer claims the overthinking threshold it cannot measure", () => {
    render(<Page15 />);
    // The authored inverse-U asserted that easy problems cross a threshold before hard
    // ones. Pooled over all three checkpoints the medians are identical, so the claim is
    // gone from the page rather than softened. See docs/page_17_findings.md section 4.
    expect(PAGE17.levelNull.easyBreaksSooner).toBe(false);
    // No figure asserts it and no step is built on it. The retraction itself is no
    // longer printed: it addressed readers of an earlier draft, and a reader who
    // never met the claim cannot be told it was withdrawn. Its account lives in the
    // file header and in docs/page_17_findings.md section 4, and the loader keeps
    // the null reachable, which is what stops it creeping back.
    expect(screen.queryByRole("img", { name: /easy problems against hard ones/i })).toBeNull();
    expect(screen.queryByText(/authored shape/i)).toBeNull();
    expect(screen.queryByText(/overthinking threshold/i)).toBeNull();
    expect(screen.queryByText(/easy problems/i)).toBeNull();
  });

  // ---- cross-references and the seam ----

  it("sends the reader to page 14 for R1's learned re-check", () => {
    render(<Page15 />);
    const claim = screen.getByText(/RL taught DeepSeek-R1/i);
    expect(claim.textContent).toMatch(/\(page 14\)/);
    // Every page this one points at must still exist. 15 is the last.
    for (const m of (claim.textContent ?? "").matchAll(/page (\d+)/gi)) {
      expect(Number(m[1])).toBeLessThanOrEqual(15);
    }
  });

  it("does not carry the contamination caveat, which is not a way reasoning breaks", () => {
    render(<Page15 />);
    // The caveat landed here only because this page used to back-reference the
    // scoreboard page, cut on 2026-08-10. It is about whether the measurements
    // mean anything, not about a mechanism by which reasoning breaks, so it now
    // lives in page 16's "what this deck did not settle", which already carried
    // the claim and used to point here for its size. Page 16's test owns it.
    expect(screen.queryByText(/one caveat that reaches backwards/i)).toBeNull();
    expect(screen.queryByText(/measured on problems the model may/i)).toBeNull();
  });

  it("hands the chain-is-the-reason question forward instead of ending on a reference note", () => {
    render(<Page15 />);
    // This aimed at page 18 (faithfulness) until that page was cut, then briefly
    // closed the deck. Page 16 closes now, so this is a handoff again, and the
    // thing handed forward is the assumption the whole page rested on.
    const close = screen.getByText(/every lever in this story on one axis/i);
    expect(close.closest("div")!.textContent).toMatch(/all three take it for what it says it is/i);
  });

  it("carries no em dash or en dash in rendered copy", () => {
    // House rule, swept and enforced on pages 5-9, 13 and 14: visible copy uses
    // commas, colons or semicolons, and ranges are spelled out ("7 to 30
    // points"). Covers aria-labels and chart titles, which screen readers speak.
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
