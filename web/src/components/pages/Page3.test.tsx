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

const fiveYearSlider = () => screen.getByRole("slider", { name: /drag through five years/i });
const dragMonths = (v: number) =>
  fireEvent.change(fiveYearSlider(), { target: { value: String(v) } });

describe("Page 3 (Training Daily?)", () => {
  it("shows both problems, the slider, and the guess box up front", () => {
    render(<Page3 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Training Daily?");
    // Problem one: the combined cost curve. The old one-year meter stays gone.
    expect(screen.getByText(/problem one · the bill compounds/i)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /combination across five years/i })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /cumulative bill/i })).toBeNull();
    expect(screen.queryByRole("slider", { name: /drag through the year/i })).toBeNull();
    expect(screen.getByText(/Training price is not a fixed number/i)).toBeInTheDocument();
    expect(fiveYearSlider()).toBeInTheDocument();
    // Problem two: the data wall, with the two cited anchors.
    expect(screen.getByText(/problem two · the data runs out/i)).toBeInTheDocument();
    // The Chinchilla hinge: money alone can't buy capability, tokens must scale too.
    expect(screen.getByText(/20 tokens per parameter/i)).toBeInTheDocument();
    expect(screen.getByText(/A quarter the size, four times the data/i)).toBeInTheDocument();
    expect(screen.getByText("≈300T tokens")).toBeInTheDocument();
    expect(screen.getByText("2026–2032")).toBeInTheDocument();
    // The data wall is a timeline meter, not a pair of static tiles.
    expect(
      screen.getByRole("img", { name: /cited full-utilization window/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/No budget buys tokens that do not exist/i)).toBeInTheDocument();
    // The guess, hinting back at page 1's multiplication round.
    expect(screen.getByText(/different scope/i)).toBeInTheDocument();
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
    // months defaults to 12; the frontier tile reads its year-one compounding
    // total and the same-model tile reads the flat year rate.
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
    expect(screen.getByText("$28.5B")).toBeInTheDocument();
    expectClean();
  });

  it("dragging the five-year meter lands in the trillions and announces the crossing", () => {
    render(<Page3 />);
    dragMonths(60);
    expect(screen.getByText("$2.6T")).toBeInTheDocument();
    expect(screen.getByText(/passed one trillion dollars/)).toBeInTheDocument();
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

  it("citations sit at the bottom of the page", () => {
    render(<Page3 />);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
    expectClean();
  });
});
