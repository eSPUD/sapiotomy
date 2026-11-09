/**
 * Page 9's component tests.
 *
 * The select-by-process figure in beat 2 has its own tests
 * (Page9SelectByProcess.test.tsx). These assert on the page's order and on its
 * honesty: that the measured figures draw the run's numbers and that the PRM's
 * reliability stays in the notebook.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { BEST_OF_N, PAGE9, pct } from "@/lib/page09";
import { Page9 } from "./Page9";

const HERE = dirname(fileURLToPath(import.meta.url));
const NOTEBOOK = "9_Best_of_N_PRM_dev.ipynb";

const pickFigure = () => screen.getByRole("img", { name: /how often each judge lands on the right answer/i });
const breakFigure = () => screen.getByRole("img", { name: /a low step appears in/i });
const heights = (fig: Element, selector: string) =>
  Array.from(fig.querySelectorAll(selector)).map((b) => Number(b.getAttribute("data-h")));

// The PRM's reliability against the checker is measured in the notebook, and
// quoting it here bought a reader looking at the bars nothing they could act on.
describe("Page 9's PRM reliability is the notebook's to state", () => {
  it("quotes no AUC anywhere on the page", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toMatch(/AUC/);
  });
});

describe("Page 9 (outcome vs process supervision) component", () => {
  it("contrasts outcome and process before it says what a PRM is, and has no draft beat", () => {
    render(<Page9 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toMatch(/^1\. outcome or process\?/i);
    expect(headings[1]).toMatch(/^2\. how does a PRM pick\?/i);
    expect(headings[2]).toMatch(/^3\. vote, verifier, process/i);
    expect(headings[3]).toMatch(/^4\. where the chain breaks/i);
    expect(headings).toHaveLength(4);
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

  it("draws every judge's accuracy, taller for a better pick, with the PRM marked", () => {
    render(<Page9 />);
    const { bars } = BEST_OF_N;
    const values = [bars.one_chain, bars.vote, ...(bars.orm === null ? [] : [bars.orm]), bars.prm];
    const fig = pickFigure();
    for (const v of values) expect(fig.getAttribute("aria-label")).toContain(pct(v));
    const h = heights(fig, "path[data-h]");
    expect(h).toHaveLength(values.length);
    h.forEach((height, i) => expect(height / h[h.length - 1]).toBeCloseTo(values[i] / bars.prm, 6));
    const marks = Array.from(fig.querySelectorAll("path[data-h]"));
    expect(marks[marks.length - 1].getAttribute("class")).toContain("fill-compute");
  });

  it("draws no ORM bar until the ORM has run", () => {
    render(<Page9 />);
    const shown = pickFigure().getAttribute("aria-label")!.includes("ORM");
    expect(shown).toBe(BEST_OF_N.bars.orm !== null);
  });

  it("states the PRM's lead with its disagreements, its ties and every temperature", () => {
    render(<Page9 />);
    const p = screen.getByText(/are tied votes, which count as wrong/i);
    const { disagreements: d, leadByTemperature } = BEST_OF_N;
    expect(p.textContent).toContain(`solves ${d.prm_only} problems the vote misses`);
    expect(p.textContent).toContain(`the vote solves ${d.vote_only === 0 ? "none" : d.vote_only} that the PRM misses`);
    expect(p.textContent).toContain(`Of those ${d.prm_only}, ${d.prm_only_on_a_tied_vote} are tied votes`);
    const lead = leadByTemperature.map((x) => Math.round(x * BEST_OF_N.nProblems));
    expect(p.textContent).toContain(`${Math.min(...lead)} to ${Math.max(...lead)} problems`);
    expect(lead.length).toBe(11);
  });

  it("draws one bin of the break figure per ten percent, in each group, with the right chains' false alarms", () => {
    render(<Page9 />);
    const fig = breakFigure();
    for (const key of ["wrong", "right"] as const) {
      const g = BEST_OF_N.breaks.byCut[BEST_OF_N.breaks.mainCut][key];
      const band = fig.querySelector(`[data-group="${key}"]`)!;
      const h = heights(band, 'path[data-bar="bin"]');
      expect(h).toHaveLength(10);
      const noLow = heights(band, 'path[data-bar="no-low"]')[0];
      g.bins.forEach((n, i) => expect(h[i] / noLow).toBeCloseTo(n / g.no_low_step, 6));
    }
  });

  it("moves the readouts with the dial and starts at the main cut", () => {
    render(<Page9 />);
    const { byCut, mainCut } = BEST_OF_N.breaks;
    const dial = screen.getByRole("radiogroup", { name: /low step cut/i });
    const radios = Array.from(dial.querySelectorAll('[role="radio"]'));
    expect(radios).toHaveLength(Object.keys(byCut).length);
    expect(dial.querySelector('[aria-checked="true"]')!.textContent).toBe(Number(mainCut).toFixed(2));

    fireEvent.click(screen.getByRole("radio", { name: "0.90" }));
    const label = breakFigure().getAttribute("aria-label")!;
    expect(label).toContain(pct(byCut["0.9"].wrong.share_with_low_step));
    expect(label).toContain(pct(byCut["0.9"].right.share_with_low_step));
  });

  it("keeps the prose out of the figure cards", () => {
    render(<Page9 />);
    const lead = screen.getByText(/are tied votes/i);
    const breaks = screen.getByText(/does not always mean a wrong chain/i);
    expect(lead.closest("figure")).toBeNull();
    expect(breaks.closest("figure")).toBeNull();
  });

  it("states the PRM's miss on steps arithmetic proves false", () => {
    render(<Page9 />);
    const p = screen.getByText(/take two steps that arithmetic proves false/i);
    expect(p.textContent).toContain(PAGE9.broken.steps[PAGE9.broken.firstFalse!].prm!.toFixed(2));
    expect(p.textContent).toContain(PAGE9.lucky.steps[PAGE9.lucky.firstFalse!].prm!.toFixed(2));
  });

  it("ends section 4 on the turn to judging at answer time", () => {
    render(<Page9 />);
    expect(screen.getByText(/check its own reasoning at answer time\?/i)).toBeInTheDocument();
    expect(screen.queryByText(/the whole case for grading steps/i)).toBeNull();
  });

  it("has no em dash or en dash anywhere in its copy", () => {
    render(<Page9 />);
    expect(document.body.textContent).not.toContain("—");
    expect(document.body.textContent).not.toContain("–");
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

  // House rule, pages 3-8: the note sits beside the beat that carries its marker.
  it("cites Lightman where the PRM is named, with the reference beside that beat", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /Let's Verify Step by Step/ });
    expect(link).toHaveAttribute("href", "https://arxiv.org/abs/2305.20050");
    const beat = document.querySelector("a[href='#ref-1']")!.closest("section")!;
    expect(beat.querySelector("h2")!.textContent).toMatch(/^1\. outcome or process\?/i);
    const note = screen.getByText("References").closest("aside")!;
    expect(beat.nextElementSibling).toBe(note);
    expect(note.querySelector("#ref-1")).not.toBeNull();
  });

  it("leaves the run conditions to the notebook, downloadable from the top line", () => {
    render(<Page9 />);
    const link = screen.getByRole("link", { name: /download the notebook/i });
    expect(link).toHaveAttribute("href", `/notebooks/${NOTEBOOK}`);
    expect(link).toHaveAttribute("download");
    expect(link.textContent).toContain("ipynb, 28 KB");
    expect(screen.queryByText(/top-p/i)).toBeNull();
  });

  it("serves the repo's copy of the notebook, at the size the page states", () => {
    const served = readFileSync(resolve(HERE, `../../../public/notebooks/${NOTEBOOK}`));
    expect(served.equals(readFileSync(resolve(HERE, `../../../../notebooks/${NOTEBOOK}`)))).toBe(true);
    expect(`${Math.round(served.length / 1e3)} KB`).toBe("28 KB");
  });
});
