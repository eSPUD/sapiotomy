/**
 * Page 9's component tests.
 *
 * The select-by-process figure in beat 1 has its own tests
 * (Page9SelectByProcess.test.tsx). These assert on the page's order and on its
 * honesty: that the measured numbers arrive with their caveats, that the PRM's
 * reliability stays in the notebook, and that the draft beat below the page
 * keeps its citation beside it.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PAGE9, pct } from "@/lib/page09";
import { Page9 } from "./Page9";

// The PRM's reliability against the checker is measured in the notebook, and
// quoting it here bought a reader looking at the bars nothing they could act on.
// It is gone from the page entirely rather than demoted.
//
// Page 15's audit-surface beat was moved here on 2026-08-10 and cut the same day.
// It would have earned the numbers back by saying WHERE they were taken, but it
// needed a second bar restating the checker's split and a paragraph under it, and
// the rate beat does not have room. The whole claim left the deck, so the rule
// stands as it was and this is the guard that keeps it standing.
describe("Page 9's PRM reliability is the notebook's to state", () => {
  it("quotes no AUC anywhere on the page", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toMatch(/AUC/);
  });

  it("draws one figure in the rate beat, not two", () => {
    render(<Page9 />);
    // The audit bar was the second. The rate beat already carries a figure with
    // three qualifications under it; a reader will not carry a fourth.
    expect(screen.queryByRole("img", { name: /can adjudicate/i })).toBeNull();
    expect(screen.queryByText(/were all measured in here/i)).toBeNull();
  });
});

describe("Page 9 (outcome vs process supervision) component", () => {
  it("contrasts outcome and process before it says what a PRM is, with the draft last", () => {
    render(<Page9 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toMatch(/^1\. outcome or process\?/i);
    expect(headings[1]).toMatch(/^2\. how does a PRM pick\?/i);
    expect(headings[2]).toMatch(/^3\. what step grading buys/i);
    expect(headings[3]).toMatch(/^4\. where the chain breaks/i);
    expect(headings[4]).toMatch(/^draft: what can be graded at all/i);
    expect(headings).toHaveLength(5);
  });

  // The "Find the break" chain viewer was cut on 2026-11-07.
  it("has no chain viewer left on the page", () => {
    render(<Page9 />);
    expect(screen.queryByText(/find the break/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /process view/i })).toBeNull();
    expect(screen.queryByText("The underline")).toBeNull();
    expect(document.body.textContent).not.toMatch(/\bLucky\b/);
  });

  it("opens on the intro's question and answers it before it defines a PRM", () => {
    render(<Page9 />);
    expect(screen.getByText(/so why judge the steps\?/i)).toBeInTheDocument();
    const answer = screen.getByText(/a judge trained only on the outcome reads the steps/i);
    const definition = screen.getByText(/a PRM gives every step a score, but Best-of-N needs a single pick/i);
    expect(answer.compareDocumentPosition(definition) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const figure = document.getElementById("prm-select")!;
    expect(definition.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("keeps the draft beat's three conditions on a gradable step", () => {
    render(<Page9 />);
    expect(screen.getByText(/there has to be a fact/i)).toBeInTheDocument();
    expect(screen.getByText(/a right answer can be reached by a wrong step/i)).toBeInTheDocument();
    expect(screen.getByText(/the unit is the step, not the word/i)).toBeInTheDocument();
  });

  it("states the checker's reach with the run's step count", () => {
    render(<Page9 />);
    const reach = screen.getByText(/state nothing it can compute/i);
    expect(reach.textContent).toContain(PAGE9.graders.stepsTotal.toLocaleString());
  });

  it("frames the rate beat's figure and identifies the graders it plots", () => {
    render(<Page9 />);
    expect(
      screen.getByText(/how often a right answer hides a false step/i),
    ).toBeInTheDocument();
    // The PRM is named by model, not left as a generic "process reward model", and
    // the answer-key check is stated as the zero baseline rather than plotted as a model.
    // It is named so it cannot be read as section 1's ORM, which reads the working.
    if (PAGE9.graders.prm) {
      const name = PAGE9.graders.prm.id.split("/").pop()!.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(screen.getAllByText(new RegExp(name)).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/catches none of this by construction/i)).toBeInTheDocument();
    expect(screen.queryByText(/^Outcome grader$/)).toBeNull();
    expect(screen.getByText(/^Answer-key check, 0%\./)).toBeInTheDocument();
    const bars = screen.getByRole("img", { name: /a false step is provable/i });
    expect(bars.getAttribute("aria-label")).toMatch(/an answer-key check, which compares only the final answer/i);
    expect(bars.getAttribute("aria-label")).not.toMatch(/outcome grader/i);
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
    // Nothing points at a margin for it, or at a chain that is no longer drawn.
    expect(document.body.textContent).not.toMatch(/see the margin/i);
    expect(caption.textContent).not.toMatch(/above/i);
  });

  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page9 />);
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
   * The two tests above read text, so they would both still pass if the bars
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

  // Everything that justified the instruments rather than helping read them (the
  // sampling conditions, the PRM's reliability and quantisation) went back to the
  // notebook on 2026-08-10.
  it("keeps run conditions off the margins and names the PRM by its own label", () => {
    render(<Page9 />);
    expect(screen.queryByText("Provenance")).toBeNull();
    expect(screen.queryByText("The PRM")).toBeNull();
    if (PAGE9.graders.prm) {
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

  // House rule, pages 3-8: the note sits beside the beat that carries its marker.
  it("puts the references note beside the beat that carries the marker", () => {
    render(<Page9 />);
    const note = screen.getByText("References").closest("aside")!;
    const beat = document.querySelector("a[href='#ref-1']")!.closest("section")!;
    expect(beat.parentElement).toBe(note.parentElement);
    expect(beat.nextElementSibling).toBe(note);
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
