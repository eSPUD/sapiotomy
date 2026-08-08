import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Deterministic reduced-motion: the page takes its instant path.
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

import { Page3 } from "./Page3";
import { curves } from "@/lib/curves";

const RUN_M = curves.epochRunCost.fit!.params.usdMillionPerRun;

// The spec's hard rule for this page: training only, no inference talk.
const BANNED = /inference/i;
const expectClean = () => {
  expect(document.body.textContent ?? "").not.toMatch(BANNED);
};

const yearSlider = () => screen.getByRole("slider", { name: /drag through the first year/i });
/**
 * The months control is the chart's own marker now, an SVG handle rather than
 * an <input type="range">, so it is driven by key presses. Home parks it at
 * month 0 and each ArrowRight steps one month, which also keeps a standing
 * check that the marker is operable without a pointer.
 */
const dragMonths = (v: number) => {
  fireEvent.keyDown(yearSlider(), { key: "Home" });
  for (let i = 0; i < v; i++) fireEvent.keyDown(yearSlider(), { key: "ArrowRight" });
};

describe("Page 3 (Training-Time Scaling)", () => {
  it("shows both problems, the slider, and the guess box up front", () => {
    render(<Page3 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Training-Time Scaling");
    // Section 1's four walls are each their own sub-head; section 2 is now a
    // two-sentence summary with no sub-heads.
    for (const h of [
      /The bill compounds/i,
      /It always lags/i,
      /It cannot be aimed/i,
      /The data runs out/i,
    ]) {
      expect(screen.getByRole("heading", { level: 3, name: h })).toBeInTheDocument();
    }
    // The bias section states both limits as prose.
    expect(screen.getByText(/more reading cannot answer\s*it/i)).toBeInTheDocument();
    expect(screen.getByText(/sharpens that\s*default/i)).toBeInTheDocument();
    // Step 1: the combined cost curve. The old one-year meter stays gone.
    expect(
      screen.getByRole("heading", { level: 2, name: /1\. Challenges in addressing knowledge gaps/i }),
    ).toBeInTheDocument();
    // The cost chart carries the draggable marker, so its svg is a group: role
    // img forbids interactive descendants (axe: nested-interactive).
    expect(screen.getByRole("group", { name: /the first year/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cumulative bill/i })).toBeNull();
    expect(screen.queryByRole("slider", { name: /drag through the year/i })).toBeNull();
    expect(screen.getByText(/Training price is not a fixed number/i)).toBeInTheDocument();
    expect(yearSlider()).toBeInTheDocument();
    // Step 2: the data wall, with the two cited anchors.
    expect(
      screen.getByRole("heading", { level: 2, name: /2\. Challenges in addressing knowledge bias/i }),
    ).toBeInTheDocument();
    // Step 3: the guess, under the same numbered spine as pages 1 and 4.
    // The scaling-law spine: bigger models only pay off if they read more, in step.
    expect(screen.getByText(/which is the scaling law/i)).toBeInTheDocument();
    // The featured number, plainly glossed; the Chinchilla comparison moved to the footer.
    expect(screen.getByText("≈300T tokens")).toBeInTheDocument();
    expect(screen.getByText(/tokens: the pieces of text a model reads/i)).toBeInTheDocument();
    expect(screen.queryByText(/A quarter the size, four times the data/i)).toBeNull();
    expect(screen.getByText("2026–2032")).toBeInTheDocument();
    // The data wall is a timeline meter, not a pair of static tiles.
    expect(
      screen.getByRole("img", { name: /cited full-utilization window/i }),
    ).toBeInTheDocument();
    // Step 2 owns a control of its own: the projection's year marker.
    expect(
      screen.getByRole("slider", { name: /drag through the projected years/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No budget buys tokens that do not exist/i)).toBeInTheDocument();
    // The flat per-run rate still anchors the legend, caption, and footer.
    expect(screen.getAllByText(new RegExp(`\\$${RUN_M}M`)).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /page navigation/i })).toBeInTheDocument();
    expectClean();
  });

  it("the combined figure shows year one already beating the flat plan", () => {
    render(<Page3 />);
    // The slider opens mid-year, so drag it out to read the full twelve months:
    // the compounding plan lands above the flat plan's whole-year total.
    dragMonths(12);
    // Each total appears twice now: printed at the marker on the plot, and in
    // the labelled tile beneath it.
    expect(screen.getAllByText("$45.5B")).toHaveLength(2);
    expect(screen.getAllByText("$28.5B")).toHaveLength(2);
    expectClean();
  });

  it("dragging the year out overtakes the flat rate and announces the crossing", () => {
    render(<Page3 />);
    dragMonths(12);
    expect(screen.getAllByText("$45.5B").length).toBeGreaterThan(0);
    expect(screen.getByText(/outspent a full year at the flat rate/)).toBeInTheDocument();
    expectClean();
  });

  // The page's designed aha reached the sr-only live region and nowhere else, so a
  // sighted reader dragged straight past the moment the figure is built around.
  it("shows the crossing on screen, not only to a screen reader", () => {
    render(<Page3 />);
    dragMonths(0);
    expect(screen.queryByText(/outspent a/)).toBeNull();
    dragMonths(12);
    // Two matches: the live region for a screen reader, and the chip for everyone else.
    const said = screen.getAllByText(/already outspent a/);
    expect(said.length).toBe(2);
    expect(said.filter((el) => el.closest(".sr-only") === null)).toHaveLength(1);
    expectClean();
  });

  // First load-bearing use of the word in the deck, and pages 5 and 11 are denominated
  // in it.
  it("glosses parameter where it first carries weight", () => {
    render(<Page3 />);
    expect(document.body.textContent).toMatch(
      /one of the numbers inside the model that training adjusts/,
    );
  });

  it("each figure answers only to its own control", () => {
    render(<Page3 />);
    const projMarker = screen.getByRole("slider", { name: /drag through the projected years/i });
    const projBefore = projMarker.getAttribute("aria-valuenow")!;
    // Step 1's marker moves step 1's totals and leaves the projection alone.
    dragMonths(12);
    expect(screen.getAllByText("$45.5B").length).toBeGreaterThan(0);
    expect(projMarker).toHaveAttribute("aria-valuenow", projBefore);
    // ...and step 2's marker moves the projection without touching step 1.
    fireEvent.keyDown(projMarker, { key: "ArrowLeft" });
    expect(projMarker).not.toHaveAttribute("aria-valuenow", projBefore);
    expect(screen.getAllByText("$45.5B").length).toBeGreaterThan(0);
    expectClean();
  });

  it("the projection reads out its median and band, and flags passing the stock", () => {
    render(<Page3 />);
    const marker = screen.getByRole("slider", { name: /drag through the projected years/i });
    // Opens on the crossing year. The median at that January is still under the
    // ceiling (it crosses mid-year), so the readout reports a share, and the
    // crossing date is stated alongside it either way.
    expect(screen.getByText(/% of the stock/)).toBeInTheDocument();
    expect(screen.getByText(/the median crosses the stock in/i)).toBeInTheDocument();
    // Step forward and the median is past the whole stock.
    fireEvent.keyDown(marker, { key: "ArrowRight" });
    expect(screen.getByText(/past the whole stock/i)).toBeInTheDocument();
    expectClean();
  });

  it("names the projection as the trend one, not the compute one", () => {
    render(<Page3 />);
    expect(screen.getByText(/the trend projection only/i)).toBeInTheDocument();
    expect(screen.getByText(/compute-based projection, which is not/i)).toBeInTheDocument();
    expectClean();
  });

  it("closes on two sentences that state both failures and hand off", () => {
    render(<Page3 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/buys more facts, later, at compounding cost/i);
    expect(body).toMatch(/cannot touch a bias\s*that was never about missing facts/i);
    // the hand-off, and the page's standing rule that it never names the sequel
    expect(body).toMatch(/leaves only what it does\s*after it/i);
    expectClean();
  });

  it("each margin note carries only the sources its section uses", () => {
    render(<Page3 />);
    const notes = Array.from(document.querySelectorAll("aside")).map((a) => a.textContent ?? "");
    // Section 1's References note, and section 2's "Why bias happens" sidenote.
    expect(notes).toHaveLength(2);
    const [gaps, bias] = notes;

    // The gap section owns every cost and data source, and none of the bias one.
    for (const ref of [/Sevilla/, /Cottier/, /AI Index/, /Hoffmann/, /Villalobos/, /data-stock/]) {
      expect(gaps).toMatch(ref);
    }
    expect(gaps).not.toMatch(/Zhao/);
    // The bias sidenote explains the cause and cites Zhao et al. for it.
    expect(bias).toMatch(/Why bias happens/i);
    expect(bias).toMatch(/likeliest next token/i);
    expect(bias).toMatch(/Zhao/);
    // The trimmed-away challenges' sources are gone from the page entirely.
    expect(document.body.textContent ?? "").not.toMatch(/Shumailov|Askell/);
    expectClean();
  });

  it("cites in the margin and at the page foot: the figures hold markers, not chips", () => {
    render(<Page3 />);
    expect(screen.queryByText(/how to read this page/i)).toBeNull();
    expect(screen.queryByText(/one dial runs the page/i)).toBeNull();
    // The old provenance prose stays gone; the margin holds References notes only.
    expect(screen.queryByText(/where the bill comes from/i)).toBeNull();
    expect(screen.queryByText(/where the wall comes from/i)).toBeNull();
    expect(screen.getAllByText("References")).toHaveLength(1);
    // The figures carry inline numbered markers; the link chips left the steps
    // for a single row at the foot of the page.
    const bill = screen.getByRole("figure", { name: /problem one/i });
    const data = screen.getByRole("region", { name: /problem two/i });
    expect(bill.querySelector("a")).toBeNull();
    expect(data.querySelector("a")).toBeNull();
    expect(bill.querySelectorAll("sup")).toHaveLength(3);
    // three now: the scaling law, the stock, and the observed dataset-size table
    expect(data.querySelectorAll("sup")).toHaveLength(3);
    const badges = screen.getAllByRole("link");
    expect(badges.map((a) => a.textContent ?? "").join(" | ")).toMatch(
      /Sevilla.*Cottier.*AI Index.*Hoffmann.*Villalobos/,
    );
    // Provenance survives inline, in the h2 annotations.
    expect(screen.getByText(/derived from the two Epoch trends/i)).toBeInTheDocument();
    expect(screen.getByText(/cited stock, derived demand/i)).toBeInTheDocument();
    expect(screen.getByText(/not a burn rate/i)).toBeInTheDocument();
    expectClean();
  });
});
