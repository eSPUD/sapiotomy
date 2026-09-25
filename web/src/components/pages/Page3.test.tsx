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
    // Section 1's three walls are each their own sub-head, lettered a to c;
    // section 2 is one paragraph with no sub-heads.
    for (const h of [/a\. Rising cost/i, /b\. Always behind/i, /c\. Not enough text/i]) {
      expect(screen.getByRole("heading", { level: 3, name: h })).toBeInTheDocument();
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
    expect(screen.queryByRole("heading", { level: 3, name: /It cannot be aimed/i })).toBeNull();
    // The bias section states both limits as prose.
    expect(document.body.textContent).toMatch(/More data would not have helped\./);
    expect(screen.getByText("strengthens that bad habit")).toBeInTheDocument();
    // Step 1: the combined cost curve. The old one-year meter stays gone.
    expect(
      screen.getByRole("heading", { level: 2, name: /1\. Challenges in addressing knowledge gaps/i }),
    ).toBeInTheDocument();
    // The cost chart carries the draggable marker, so its svg is a group: role
    // img forbids interactive descendants (axe: nested-interactive).
    expect(screen.getByRole("group", { name: /the first year/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cumulative bill/i })).toBeNull();
    expect(screen.queryByRole("slider", { name: /drag through the year/i })).toBeNull();
    expect(screen.getByText(/What would it cost to retrain a model every day for a year\?/)).toBeInTheDocument();
    expect(yearSlider()).toBeInTheDocument();
    // Step 2: the data wall, with the two cited anchors.
    expect(
      screen.getByRole("heading", { level: 2, name: /2\. Challenges in addressing knowledge bias/i }),
    ).toBeInTheDocument();
    // Step 3: the guess, under the same numbered spine as pages 1 and 4.
    // The scaling-law spine: bigger models only pay off if they read more, in step.
    expect(document.body.textContent).toMatch(
      /a\s*scaling law, measured across hundreds of models, calls for about\s*20 tokens \(pieces of text, roughly a word each\) for\s*every parameter/i,
    );
    // The stock card and the window meter are cut: the prose carries 300T and the
    // token gloss, the chart carries the stock line, the readout carries the window.
    expect(screen.queryByText("≈300T tokens")).toBeNull();
    expect(screen.queryByText(/A quarter the size, four times the data/i)).toBeNull();
    expect(screen.queryByRole("img", { name: /cited full-utilization window/i })).toBeNull();
    // The projection's marker is fixed: no slider for the reader to move.
    expect(screen.queryByRole("slider", { name: /projected years/i })).toBeNull();
    expect(document.body.textContent).toMatch(
      /Only about 300 trillion tokens of quality writing\s*exist, and no budget buys tokens that do not exist/i,
    );
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

  // The on-screen month callout was cut at the author's request; the crossing is
  // still announced to a screen reader through the live region.
  it("announces the crossing to a screen reader, with no on-screen callout", () => {
    render(<Page3 />);
    dragMonths(12);
    const said = screen.getAllByText(/already outspent a/);
    expect(said.every((el) => el.closest(".sr-only") !== null)).toBe(true);
    expect(screen.queryByText(/whole year/)).toBeNull();
    expectClean();
  });

  // First load-bearing use of the word in the deck, and pages 5 and 11 are denominated
  // in it.
  it("glosses parameter where it first carries weight", () => {
    render(<Page3 />);
    expect(document.body.textContent).toMatch(
      /parameter \(a number training adjusts\)/,
    );
  });

  it("the cost chart has the page's only control", () => {
    render(<Page3 />);
    expect(screen.getAllByRole("slider")).toHaveLength(1);
    dragMonths(12);
    expect(screen.getAllByText("$45.5B").length).toBeGreaterThan(0);
    expectClean();
  });

  it("the projection reads out today's value on a fixed marker", () => {
    render(<Page3 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/The largest training set in\s*Sep 2026:\s*≈\d+T tokens, \d+% of all quality text\./);
    expect(body).toMatch(/At this pace it runs out around (mid-|late )\s*\d{4}/);
    expect(body).toMatch(/Epoch's range: \d{4} to\s*\d{4}/);
    expect(body).not.toMatch(/Drag the year/);
    // The fixed marker is labelled "Today".
    expect(screen.getByText("Today")).toBeInTheDocument();
    expectClean();
  });

  it("captions the projection by where it meets the stock, with no footnote", () => {
    render(<Page3 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Epoch projects the largest training sets growing about\s*×\d\.\d a year/);
    // The marker opens on the current month, Sep 2026, and moves in 3-month steps.
    expect(body).toMatch(/The largest training set in\s*Sep 2026:/);
    // The shaded band is explained in the caption, now that the readout no longer quotes it.
    expect(body).toMatch(/likely between ×\s*1\.8 and ×3\.1 \(the\s*shading\)/);
    expect(body).not.toMatch(/compute-based projection/i);
    expect(body).not.toMatch(/inside the window below/i);
    expectClean();
  });

  it("puts section a's text above the chart, not inside its frame", () => {
    render(<Page3 />);
    const bill = screen.getByRole("figure", { name: /problem one/i });
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /For\s*a few missing facts, that bill is not economically feasible\./,
    );
    expect(body).toMatch(/Drag the slider to run the plan forward\./);
    // The frame holds the chart and its readout only.
    expect(bill.textContent).not.toMatch(/missing facts|What would it cost|Frontier training runs/);
    expect(body).not.toMatch(/Nothing spent yet/);
  });

  it("opens on the original lede and closes on the plain verdict", () => {
    render(<Page3 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/A missing fact needs new knowledge, and the obvious way to supply it is to\s*train the model again\./);
    expect(body).not.toMatch(/The bill says no/);
    expect(body).toMatch(/Retraining runs into three problems: what it costs, how long it takes, and how much text\s*there is to train on\./);
    expect(body).toMatch(/buys more knowledge, narrowing the knowledge gap, but at a compounding\s*cost/i);
    expect(body).toMatch(/It can also make the knowledge bias worse\./);
    // the hand-off, and the page's standing rule that it never names the sequel
    expect(body).toMatch(/spends compute at answer time, on the\s*question actually asked/i);
    expectClean();
  });

  it("keeps rendered text free of em dashes", () => {
    render(<Page3 />);
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
    dragMonths(12);
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
  });

  it("each margin note carries only the sources its section uses", () => {
    render(<Page3 />);
    const notes = Array.from(document.querySelectorAll("aside"))
      .map((a) => a.textContent ?? "")
      .filter((t) => t.startsWith("References"));
    // Section 1's References note only: section 2 cites nothing.
    expect(notes).toHaveLength(1);
    const [gaps] = notes;

    // The gap section owns every cost and data source.
    for (const ref of [/Cottier/, /AI Index/, /Hoffmann/, /Villalobos/, /data-stock/]) {
      expect(gaps).toMatch(ref);
    }
    // The cut "Why bias happens" note took WinoBias with it; the trimmed-away
    // challenges' sources are gone from the page entirely.
    expect(document.body.textContent ?? "").not.toMatch(/Why bias happens|Zhao|Shumailov|Askell|Sevilla/);
    // References stay numbered 1 to 5 in order of first appearance.
    // Read each linked number (a marker may hold several, comma separated).
    const nums = Array.from(document.querySelectorAll("sup a")).map((a) =>
      Number(a.getAttribute("href")!.replace("#ref-", "")),
    );
    expect([...new Set(nums)]).toEqual([1, 2, 3, 4, 5]);
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
    // The figures carry inline numbered markers; the external reference chips
    // left the steps for a single row at the foot of the page. The markers
    // themselves are in-page anchors to the sidenote (#ref-n), so a figure may
    // hold those, but never an external link.
    const bill = screen.getByRole("figure", { name: /problem one/i });
    const data = screen.getByRole("region", { name: /problem two/i });
    const externalLinks = (el: HTMLElement) =>
      Array.from(el.querySelectorAll("a")).filter((a) =>
        a.getAttribute("href")?.startsWith("http"),
      );
    expect(externalLinks(bill)).toHaveLength(0);
    expect(externalLinks(data)).toHaveLength(0);
    // Every citation marker in a figure points at its sidenote entry.
    for (const a of bill.querySelectorAll("sup a"))
      expect(a.getAttribute("href")).toMatch(/^#ref-\d+$/);
    // The bill's sources now sit in the text above the chart, as one marker "1,2".
    expect(bill.querySelectorAll("sup")).toHaveLength(0);
    const both = Array.from(document.querySelectorAll("sup")).find((s) => s.querySelectorAll("a").length === 2)!;
    expect(both.textContent).toMatch(/1,.*2/);
    // the scaling law, the stock (in the prose and again beside its window), and the dataset-size table
    expect(data.querySelectorAll("sup")).toHaveLength(4);
    const badges = screen.getAllByRole("link");
    expect(badges.map((a) => a.textContent ?? "").join(" | ")).toMatch(
      /Cottier.*AI Index.*Hoffmann.*Villalobos/,
    );
    // The provenance tags, the stock card and the window meter are cut: the
    // citations carry the sources, and the readout carries the window.
    const body = document.body.textContent ?? "";
    // Both provenance tags are cut; the citations beside each claim carry the sources.
    expect(body).not.toMatch(/derived from the two Epoch trends|cited stock, derived demand/i);
    expect(body).not.toMatch(/not a burn rate|every quality token humans have written|fully utilized/i);
    expectClean();
  });
});
