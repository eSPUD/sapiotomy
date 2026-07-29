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

const sizeSlider = () => screen.getByRole("slider", { name: /size the model/i });
const dragParams = (v: number) =>
  fireEvent.change(sizeSlider(), { target: { value: String(v) } });

describe("Page 3 (Training Daily?)", () => {
  it("shows both problems, the slider, and the guess box up front", () => {
    render(<Page3 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Training Daily?");
    // Step 1: the combined cost curve. The old one-year meter stays gone.
    expect(
      screen.getByRole("heading", { level: 2, name: /1\. The bill compounds/i }),
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
      screen.getByRole("heading", { level: 2, name: /2\. Bigger models, finite data/i }),
    ).toBeInTheDocument();
    // Step 3: the guess, under the same numbered spine as pages 1 and 4.
    expect(
      screen.getByRole("heading", { level: 2, name: /3\. So what is left\?/i }),
    ).toBeInTheDocument();
    // The scaling-law spine: bigger models only pay off if they read more, in step.
    expect(screen.getByText(/that is the scaling law/i)).toBeInTheDocument();
    // The featured number, plainly glossed; the Chinchilla comparison moved to the footer.
    expect(screen.getByText("≈300T tokens")).toBeInTheDocument();
    expect(screen.getByText(/tokens: the pieces of text a model reads/i)).toBeInTheDocument();
    expect(screen.queryByText(/A quarter the size, four times the data/i)).toBeNull();
    expect(screen.getByText("2026–2032")).toBeInTheDocument();
    // The data wall is a timeline meter, not a pair of static tiles.
    expect(
      screen.getByRole("img", { name: /cited full-utilization window/i }),
    ).toBeInTheDocument();
    // Step 2 owns a dial of its own: model size against the finite stock.
    expect(sizeSlider()).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /reading demand against the stock/i })).toBeInTheDocument();
    expect(screen.getByText(/No budget buys tokens that do not exist/i)).toBeInTheDocument();
    // The guess, hinting back at page 1's multiplication round.
    expect(screen.getByText(/paying for smarts/i)).toBeInTheDocument();
    expect(screen.getByText("17 × 24")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /your guess/i })).toBeInTheDocument();
    expect(screen.getByText("optional · skip freely")).toBeInTheDocument();
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
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
    expect(screen.getByText("$28.5B")).toBeInTheDocument();
    expectClean();
  });

  it("dragging the year out overtakes the flat rate and announces the crossing", () => {
    render(<Page3 />);
    dragMonths(12);
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
    expect(screen.getByText(/outspent a full year at the flat rate/)).toBeInTheDocument();
    expectClean();
  });

  it("each figure answers only to its own control", () => {
    render(<Page3 />);
    const stockShare = () => screen.getByRole("img", { name: /reading demand against the stock/i });
    const before = stockShare().getAttribute("aria-label");

    // Step 1's slider moves step 1's totals and leaves step 2's bar alone.
    dragMonths(12);
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
    expect(stockShare()).toHaveAttribute("aria-label", before);

    // Step 2's dial moves step 2's bar and leaves step 1's totals alone.
    dragParams(5000);
    expect(stockShare().getAttribute("aria-label")).not.toBe(before);
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
    expectClean();
  });

  it("the size dial converts parameters into reading, and says when it exceeds the stock", () => {
    render(<Page3 />);
    // Default 1000B x 20 tokens/param = 20T tokens, under the 300T stock. The
    // bar's readout and the sentence beneath it quote the same figure.
    expect(screen.getAllByText("≈20T")).toHaveLength(2);
    expect(screen.getByText(/6\.67% of everything ever written/)).toBeInTheDocument();
    // 20,000B x 20 = 400T: more text than humans have written.
    dragParams(20000);
    expect(screen.getByText(/133% — more text than exists/)).toBeInTheDocument();
    expect(screen.getByText(/more text than humans have written/)).toBeInTheDocument();
    expectClean();
  });

  it("locks a guess: echo, hold-that-thought, teaser; the form is consumed", () => {
    render(<Page3 />);
    const box = screen.getByRole("textbox", { name: /your guess/i });
    const lock = screen.getByRole("button", { name: /lock it in/i });
    expect(lock).toBeDisabled();
    fireEvent.change(box, { target: { value: "  let it search the web  " } });
    expect(lock).toBeEnabled();
    fireEvent.click(lock);
    expect(screen.getByText(/Noted:/)).toBeInTheDocument();
    expect(screen.getByText(/let it search the web/)).toBeInTheDocument();
    expect(screen.getByText(/The answer is one page away\./)).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: /your guess/i })).toBeNull();
    expectClean();
  });

  it("skip works without typing a guess", () => {
    render(<Page3 />);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(screen.getByText(/Hold that thought anyway\./)).toBeInTheDocument();
    expect(screen.queryByText(/Noted:/)).toBeNull();
    expect(screen.getByText(/The answer is one page away\./)).toBeInTheDocument();
    expectClean();
  });

  it("each step's References margin note carries only the sources that step uses", () => {
    render(<Page3 />);
    const notes = Array.from(document.querySelectorAll("aside")).map((a) => a.textContent ?? "");
    expect(notes).toHaveLength(2);
    const [bill, data] = notes;

    // The bill cites Epoch's cost anchors; Villalobos and Hoffmann stay out of it.
    expect(bill).toMatch(/AI Index/);
    expect(bill).toMatch(/Cottier/);
    expect(bill).toMatch(/Sevilla/);
    expect(bill).not.toMatch(/Villalobos|Hoffmann/);
    // The data wall cites the scaling law and the stock, and no cost trends.
    expect(data).toMatch(/Hoffmann/);
    expect(data).toMatch(/Villalobos/);
    expect(data).not.toMatch(/Cottier|AI Index|Sevilla/);
    expectClean();
  });

  it("cites in the margin and at the page foot: the figures hold markers, not chips", () => {
    render(<Page3 />);
    expect(screen.queryByText(/how to read this page/i)).toBeNull();
    expect(screen.queryByText(/one dial runs the page/i)).toBeNull();
    // The old provenance prose stays gone; the margin holds References notes only.
    expect(screen.queryByText(/where the bill comes from/i)).toBeNull();
    expect(screen.queryByText(/where the wall comes from/i)).toBeNull();
    expect(screen.getAllByText("References")).toHaveLength(2);
    // The figures carry inline numbered markers; the link chips left the steps
    // for a single row at the foot of the page.
    const bill = screen.getByRole("figure", { name: /problem one/i });
    const data = screen.getByRole("region", { name: /problem two/i });
    expect(bill.querySelector("a")).toBeNull();
    expect(data.querySelector("a")).toBeNull();
    expect(bill.querySelectorAll("sup")).toHaveLength(3);
    expect(data.querySelectorAll("sup")).toHaveLength(2);
    const badges = screen.getAllByRole("link");
    expect(badges.map((a) => a.textContent ?? "").join(" | ")).toMatch(
      /Sevilla.*Cottier.*AI Index.*Hoffmann.*Villalobos/,
    );
    // Provenance survives inline: the h2 annotations and the CC BY footnote.
    expect(screen.getByText(/derived from the two Epoch trends/i)).toBeInTheDocument();
    expect(screen.getByText(/cited stock, derived demand/i)).toBeInTheDocument();
    expect(screen.getByText(/not a burn rate/i)).toBeInTheDocument();
    expect(screen.getByText(/redrawn under CC BY/i)).toBeInTheDocument();
    expect(screen.getByText(/no claims about what any lab actually spends/i)).toBeInTheDocument();
    expectClean();
  });
});
