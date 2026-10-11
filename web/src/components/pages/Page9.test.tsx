/**
 * Page 9's component tests.
 *
 * There is no authored prose left, so these assert on the mechanic and on the
 * page's honesty: that the outcome view is blind to the working, that the reveal
 * is gated behind the reader's own answer and re-answerable, that the checker's
 * reach is shown as reach rather than as a per-step verdict, that the PRM's
 * opinion never dresses as a fact (and, on these specimens, is caught being
 * wrong), and that the three numbers the page is not allowed to quote flat arrive
 * with their caveats.
 */
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PAGE9, pct, tidyMath } from "@/lib/page09";
import { Page9 } from "./Page9";

/** The mark-a-step button label for a given zero-based step index. */
const markName = (i: number) => `Mark step ${i + 1} as the line that goes wrong`;

/** Answer the figure's one question, correctly, and reveal. */
const findTheBreakThenReveal = (trace = PAGE9.lucky) => {
  fireEvent.click(screen.getByRole("button", { name: /process view/i }));
  if (trace.firstFalse !== null) {
    fireEvent.click(screen.getByRole("button", { name: markName(trace.firstFalse) }));
  } else {
    fireEvent.click(screen.getByRole("button", { name: /nothing here breaks/i }));
  }
  fireEvent.click(screen.getByRole("button", { name: /reveal what the graders found/i }));
};

// The PRM's reliability against the checker is measured in the notebook, and
// quoting it here bought a reader looking at the bars nothing they could act on.
// It is gone from the page entirely rather than demoted.
//
// Page 15's audit-surface beat was moved here on 2026-08-10 and cut the same day.
// It would have earned the numbers back by saying WHERE they were taken, but it
// needed a second bar restating step 1's split and a paragraph under it, and beat
// 3 does not have room. The whole claim left the deck, so the rule stands as it
// was and this is the guard that keeps it standing.
describe("Page 9's PRM reliability is the notebook's to state", () => {
  it("quotes no AUC anywhere on the page", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toMatch(/AUC/);
  });

  it("draws one figure in beat 3, not two", () => {
    render(<Page9 />);
    // The audit bar was the second. Beat 3 already carries a figure with three
    // qualifications under it; a reader will not carry a fourth.
    expect(screen.queryByRole("img", { name: /can adjudicate/i })).toBeNull();
    expect(screen.queryByText(/were all measured in here/i)).toBeNull();
  });
});

describe("Page 9 (outcome vs process supervision) component", () => {
  it("sets up what a gradable step requires before the figure asks for one", () => {
    render(<Page9 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toMatch(/what can be graded at all/i);
    expect(headings[1]).toMatch(/find the break/i);
    expect(headings[2]).toMatch(/what step grading buys/i);
  });

  it("states the three conditions on a gradable step", () => {
    render(<Page9 />);
    // 1: a fact to be right about; 2: a right answer can hide a wrong step;
    // 3: the unit is the step, not the word.
    expect(screen.getByText(/there has to be a fact/i)).toBeInTheDocument();
    expect(screen.getByText(/a right answer can be reached by a wrong step/i)).toBeInTheDocument();
    expect(screen.getByText(/the unit is the step, not the word/i)).toBeInTheDocument();
  });

  it("states the checker's reach as a finding before the figure uses it", () => {
    render(<Page9 />);
    const intro = screen.getByText(/state nothing it can compute/i);
    const figure = screen.getByRole("heading", { level: 2, name: /find the break/i });
    expect(intro.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intro.textContent).toContain(PAGE9.graders.stepsTotal.toLocaleString());
  });

  it("never labels a step with the checker's silence", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.queryByText(/can't check/i)).toBeNull();
    expect(screen.queryByText(/^unknown$/i)).toBeNull();
  });

  it("opens on the outcome view, which passes the lucky chain", () => {
    render(<Page9 />);
    expect(screen.getByText(/Outcome grader: pass/i)).toBeInTheDocument();
  });

  it("redacts the working in the outcome view, because that grader cannot read it", () => {
    render(<Page9 />);
    const firstStep = PAGE9.lucky.steps[0].text.slice(0, 30);
    expect(
      screen.queryByText(new RegExp(firstStep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))),
    ).toBeNull();
  });

  it("makes the reader answer before showing the graders' verdicts", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    expect(screen.getByRole("button", { name: /pick a line first/i })).toBeDisabled();
  });

  it("toggles a pick off when the same line is clicked twice", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /process view/i }));
    const line = markName(PAGE9.lucky.firstFalse!);
    fireEvent.click(screen.getByRole("button", { name: line }));
    expect(screen.getByRole("button", { name: /reveal what the graders found/i })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: line }));
    expect(screen.getByRole("button", { name: /pick a line first/i })).toBeDisabled();
  });

  it("lets the reader grade again after the reveal", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.getByText(/that is the line the checker proves false/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /grade another line/i }));
    // Back to picking: the reveal verdict is gone and the mark buttons return.
    expect(screen.queryByText(/that is the line the checker proves false/i)).toBeNull();
    expect(
      screen.getByRole("button", { name: markName(PAGE9.lucky.firstFalse!) }),
    ).toBeInTheDocument();
  });

  it("chips a checker verdict only on the steps it could actually read", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const read = PAGE9.lucky.steps.filter((s) => s.check !== "unknown").length;
    expect(screen.getAllByText(/checked: true|checked: FALSE/)).toHaveLength(read);
    expect(read).toBeLessThan(PAGE9.lucky.steps.length);
  });

  it("shows the PRM's verdict on every step, because it is silent on none", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    if (PAGE9.graders.prm) {
      expect(screen.getAllByText(/^PRM \d\.\d\d ·/)).toHaveLength(PAGE9.lucky.steps.length);
    }
  });

  it("flags the lucky chain's false step even though its answer was right", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(screen.getAllByText("checked: FALSE").length).toBe(PAGE9.lucky.nFalse);
  });

  it("annotates that the PRM missed the break the checker proved", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const bs = PAGE9.lucky.steps[PAGE9.lucky.firstFalse!];
    // These specimens are chosen so the PRM scores the proven-false step as sound.
    if (bs.prm !== null && bs.prmVerdict !== "false") {
      expect(screen.getByText(/the PRM missed it/i)).toBeInTheDocument();
      expect(screen.getByText(/difference between a fact and a score/i)).toBeInTheDocument();
    }
  });

  it("underlines the judged claim in place rather than restating it", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const judged = PAGE9.lucky.steps.find((s) => s.claim)!;
    const marked = screen.getByText(tidyMath(judged.claim!));
    expect(marked.tagName).toBe("MARK");
    expect(screen.queryByText(/^judged:/)).toBeNull();
  });

  it("settles the reader's answer against the checker's proof", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    expect(
      screen.getByText(/that is the line the checker proves false/i),
    ).toBeInTheDocument();
    expect(screen.getByText("your pick")).toBeInTheDocument();
  });

  it("lets a clean chain be answered with 'nothing breaks'", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Clean/ }));
    findTheBreakThenReveal(PAGE9.clean);
    expect(screen.getByText(/and you said so/i)).toBeInTheDocument();
    expect(screen.getByText(/not the same as proving it sound/i)).toBeInTheDocument();
  });

  it("frames section 3's first figure and identifies the graders it plots", () => {
    render(<Page9 />);
    expect(
      screen.getByText(/how often a right answer hides a false step/i),
    ).toBeInTheDocument();
    // The PRM is named by model, not left as a generic "process reward model", and
    // the outcome grader is stated as the zero baseline rather than plotted as a model.
    if (PAGE9.graders.prm) {
      const name = PAGE9.graders.prm.id.split("/").pop()!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(screen.getAllByText(new RegExp(name)).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/catches none of this by construction/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Outcome grader$/)).toBeNull();
  });

  it("quotes detection as a floor rather than as a rate", () => {
    render(<Page9 />);
    expect(screen.getByText(/a floor, not a rate/i)).toBeInTheDocument();
    expect(screen.getByText(/undercounts/i)).toBeInTheDocument();
  });

  // The caption is a list, one entry per bar plus the baseline that is not drawn
  // as one, so these scope to the whole list rather than to the entry's own label.
  // It was a single paragraph carrying all three graders until 2026-08-10, which
  // at this type size nobody read. Same content, same place, legible shape.
  const gradersCaption = () => screen.getByText(/a floor, not a rate/i).closest("dl")!;

  // The chain rate is clustered within problems, and the run says so. Quoting it
  // alone reads as one independent observation per chain, which it is not.
  it("names the problem, not the chain, as the unit the count stands on", () => {
    render(<Page9 />);
    const caption = gradersCaption();
    expect(caption.textContent).toMatch(/the same problem sampled again/i);
    expect(caption.textContent).toContain(
      `${PAGE9.detection.nProblems} of the ${PAGE9.detection.nProblemsWithARightChain} problems`,
    );
  });

  // The PRM's cut was fitted against the checker's labels, so its bar is not a
  // second, independent reading of the checker's. That is a limit on the figure,
  // so it is stated under the bars rather than in a margin beside another beat.
  it("discloses under the bars that the PRM's cut was fitted on the checker's labels", () => {
    render(<Page9 />);
    if (!PAGE9.graders.prm) return;
    const caption = gradersCaption();
    expect(caption.textContent).toMatch(/its cut is fitted, not held out/i);
    expect(caption.textContent).toContain(PAGE9.graders.prm.threshold.toFixed(2));
    expect(caption.textContent).toMatch(/not two independent readings of the same thing/i);
    // Nothing points at a margin for it.
    expect(document.body.textContent).not.toMatch(/see the margin/i);
  });

  // Every specimen scores above the PRM's cut on every line. A reader who works
  // all three must not be left concluding the PRM never disagrees.
  it("bridges the specimens' silent PRM to the share it flags over the run", () => {
    render(<Page9 />);
    findTheBreakThenReveal();
    const quiet = PAGE9.lucky.steps.every((s) => s.prmVerdict !== "false");
    if (quiet && PAGE9.detection.prm) {
      expect(screen.getByText(/the bar in the next beat/i)).toBeInTheDocument();
      expect(screen.getByText(/quiet end of it/i)).toBeInTheDocument();
    }
  });

  // The margin says nothing underlined means nothing computable. No verdict on
  // the page may call an unread step sound.
  it("never calls an unjudged step sound", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Broken/ }));
    expect(screen.getByText(/the checker never disproved/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/that were sound/i);
    findTheBreakThenReveal(PAGE9.broken);
    expect(screen.getByText(/before the break was disproved/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/before the break stands?\b/i);
  });

  // `firstFalse` is an index. The count of steps the checker did not disprove is
  // the chain's length minus its false steps, and the two are not the same number.
  it("counts the steps the checker did not disprove rather than reusing the break index", () => {
    render(<Page9 />);
    fireEvent.click(screen.getByRole("button", { name: /^Broken/ }));
    const notDisproved = PAGE9.broken.steps.length - PAGE9.broken.nFalse;
    expect(
      screen.getByText(
        new RegExp(`including the ${notDisproved} the checker never disproved`, "i"),
      ),
    ).toBeInTheDocument();
    expect(notDisproved).not.toBe(PAGE9.broken.firstFalse);
  });

  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
    findTheBreakThenReveal();
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
  });

  it("quotes localisation with its spread whenever the run says it moves", () => {
    render(<Page9 />);
    const loc = PAGE9.localisation;
    if (!loc.survivesSegmentation) {
      const p = screen.getByText(/read it as a direction, not a digit/i);
      // The re-cuts' own range, not a band centred on the median: none of the four
      // segmentations produced the median the sentence quotes.
      expect(p.textContent).toContain(`${pct(loc.subsample.low)} to ${pct(loc.subsample.high)}`);
      expect(p.textContent).toMatch(/none of them landed on the figure quoted here/i);
      const median = (loc.medianShareSound ?? 0) * 100;
      expect(median).toBeLessThan(loc.subsample.low * 100);
    }
  });

  /**
   * The median share-sound figure says WHERE a chain breaks. It cannot say how
   * many times, and until this figure shipped the run's own answer to that was
   * loaded by lib/page09.ts and drawn nowhere. These assertions keep it drawn,
   * keep it honest about n, and keep every bar tied to the run rather than to a
   * number typed into the page.
   */
  it("draws how many false steps a wrong chain contains, not just where the first one is", () => {
    render(<Page9 />);
    const loc = PAGE9.localisation;
    const fig = screen.getByRole("img", {
      name: /how many false steps each of the .* localisable wrong chains contains/i,
    });
    // Every bin in the run reaches the figure's description; none is quietly dropped.
    for (const [n, count] of Object.entries(loc.breaksPerChain)) {
      expect(fig.getAttribute("aria-label")).toContain(
        `${count} chain${count === 1 ? "" : "s"} with ${n} false step${n === "1" ? "" : "s"}`,
      );
    }
  });

  it("prints n on the break-count figure, because 44 chains is a small n", () => {
    render(<Page9 />);
    const total = Object.values(PAGE9.localisation.breaksPerChain).reduce((a, b) => a + b, 0);
    expect(screen.getByText(`n = ${total} chains`)).toBeInTheDocument();
    // The bins have to account for the localisable population exactly, or the
    // figure is drawing a different set of chains from the sentence above it.
    expect(total).toBe(PAGE9.localisation.nLocalisable);
  });

  /**
   * The three tests above read text, so they would all still pass if the bars
   * were drawn upside down, in the wrong order, or with the wrong bin
   * highlighted. This one reads the geometry instead: the picture has to encode
   * the same data its description claims.
   */
  it("encodes the counts in the bars, in bin order, taller for more chains", () => {
    render(<Page9 />);
    const fig = screen.getByRole("img", {
      name: /how many false steps each of the .* localisable wrong chains contains/i,
    });
    const bins = Object.entries(PAGE9.localisation.breaksPerChain)
      .map(([k, count]) => ({ n: Number(k), count }))
      .sort((a, b) => a.n - b.n);
    // The plot frame carries stroke-grid; the bars are the filled marks.
    const bars = Array.from(fig.querySelectorAll("rect")).filter((r) =>
      /fill-compute|fill-ink/.test(r.getAttribute("class") ?? ""),
    );
    expect(bars).toHaveLength(bins.length);

    const x = bars.map((b) => Number(b.getAttribute("x")));
    const h = bars.map((b) => Number(b.getAttribute("height")));
    const y = bars.map((b) => Number(b.getAttribute("y")));

    // Left to right in ascending bin order, so the axis labels mean what they say.
    expect([...x]).toEqual([...x].sort((a, b) => a - b));
    // Bars grow downward from a common baseline: y + h is the same for all of them.
    for (const bottom of y.map((v, i) => v + h[i])) {
      expect(bottom).toBeCloseTo(y[0] + h[0], 6);
    }
    // Height is monotone in count, so a bigger bin is never drawn shorter. This
    // is what an inverted scale would break.
    for (let i = 0; i < bins.length; i++) {
      for (let j = 0; j < bins.length; j++) {
        if (bins[i].count > bins[j].count) expect(h[i]).toBeGreaterThan(h[j]);
        if (bins[i].count === bins[j].count) expect(h[i]).toBeCloseTo(h[j], 6);
      }
    }
    // The tallest bar is the highlighted one, and it is the single-false-step bin.
    const peakIx = h.indexOf(Math.max(...h));
    expect(bins[peakIx].n).toBe(1);
    expect(bars[peakIx].getAttribute("class")).toContain("fill-compute");
  });

  it("reads the break-count spike off the run rather than asserting a shape", () => {
    render(<Page9 />);
    const loc = PAGE9.localisation;
    const p = screen.getByText(/that is the fact the median cannot carry/i);
    expect(p.textContent).toContain(String(loc.breaksPerChain["1"]));
    if (loc.shareWithOneFalseStep !== null) {
      expect(p.textContent).toContain(pct(loc.shareWithOneFalseStep, 0));
      // The page says wrong chains usually break once. If a rerun ever makes that
      // false, this fails rather than leaving the claim standing over new data.
      expect(loc.shareWithOneFalseStep).toBeGreaterThan(0.5);
    }
  });

  it("keeps the domain caveat on screen", () => {
    render(<Page9 />);
    expect(screen.getByText(/a poem has none mid-stanza/i)).toBeInTheDocument();
  });

  // The margin beside the trace carries one thing: how to read a step the checker
  // left unmarked. Everything that justified the instruments rather than helping
  // read them (the sampling conditions, the PRM's reliability and quantisation)
  // went back to the notebook on 2026-08-10.
  it("keeps the trace's margin to the one reading key the figure cannot supply", () => {
    render(<Page9 />);
    const note = screen.getByText("The underline").closest("aside")!;
    expect(note.textContent).toBe(
      "The underlineNothing underlined means nothing computable, not nothing wrong.",
    );
    expect(screen.queryByText("Provenance")).toBeNull();
    expect(screen.queryByText("The PRM")).toBeNull();
    if (PAGE9.graders.prm) {
      // The model is still named, in the figure that plots it, by its own label.
      expect(document.body.textContent).not.toContain(PAGE9.graders.prm.id);
      expect(document.body.textContent).toContain(PAGE9.graders.prm.id.split("/").pop());
    }
    expect(document.body.textContent).not.toMatch(/upper bound|friendliest ground/i);
  });

  // The references note is a citation, not an essay about one.
  it("keeps the references note to its citation", () => {
    render(<Page9 />);
    const note = screen.getByText("References").closest("aside")!;
    expect(note.textContent).toContain(
      "Cited for the technique. The numbers here are our own model's, not theirs.",
    );
    expect(note.textContent).not.toMatch(/priority|comparable/i);
  });

  // It sat beside beat 3 while its only marker was in beat 1, two screens up.
  it("puts the references note beside the beat that carries the marker", () => {
    render(<Page9 />);
    const note = screen.getByText("References").closest("aside")!;
    const marker = document.querySelector("a[href='#ref-1']")!;
    const beat2 = screen.getByText(/2\. Find the break/);
    // Marker first, then its note, and both above the next beat.
    expect(marker.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(note.compareDocumentPosition(beat2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("cites Lightman as a numbered reference reachable from an inline marker", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /Let's Verify Step by Step/ });
    expect(link).toHaveAttribute("href", "https://arxiv.org/abs/2305.20050");
    expect(screen.queryByText("preprint")).toBeNull(); // references carry no preprint tag
    expect(document.querySelector("a[href='#ref-1']")).not.toBeNull();
    expect(document.getElementById("ref-1")).not.toBeNull();
  });

  it("leaves the run conditions to the notebook, downloadable from the top line", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /download the notebook/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-09-outcome-vs-process.zip");
    expect(link).toHaveAttribute("download");
    expect(screen.queryByText(/top-p/i)).toBeNull();
  });
});
