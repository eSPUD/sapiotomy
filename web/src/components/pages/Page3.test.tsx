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

const yearSlider = () => screen.getByRole("slider", { name: /drag through the year/i });
const dragYear = (v: number) => fireEvent.change(yearSlider(), { target: { value: String(v) } });
const fiveYearSlider = () => screen.getByRole("slider", { name: /drag through five years/i });
const dragMonths = (v: number) =>
  fireEvent.change(fiveYearSlider(), { target: { value: String(v) } });

describe("Page 3 (Daily Training?)", () => {
  it("shows two figures, the cost-climb note, both sliders, and the guess box up front", () => {
    render(<Page3 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Daily Training?");
    // Two figures now: the meter and the combined curve. The old compute-growth
    // chart is collapsed into a dense note.
    expect(screen.getByRole("img", { name: /cumulative bill/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /combination across five years/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /training compute of frontier language models/i }),
    ).toBeNull();
    expect(screen.getByText(/assumed a fixed training price/i)).toBeInTheDocument();
    expect(screen.getByText(/per-year/i)).toBeInTheDocument();
    expect(yearSlider()).toBeInTheDocument();
    expect(fiveYearSlider()).toBeInTheDocument();
    expect(screen.getByText(/training every day is simply not feasible/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /your guess/i })).toBeInTheDocument();
    expect(screen.getByText("optional · skip freely")).toBeInTheDocument();
    // Day 1: the total reads one run's cost (also quoted as the per-run rate).
    expect(screen.getAllByText(`$${RUN_M}M`).length).toBeGreaterThan(0);
    expect(screen.getByRole("navigation", { name: /page navigation/i })).toBeInTheDocument();
    expectClean();
  });

  it("dragging to day 13 crosses $1B and announces it", () => {
    render(<Page3 />);
    dragYear(13);
    expect(screen.getByText("$1.0B")).toBeInTheDocument();
    expect(screen.getByText(/passed one billion dollars/)).toBeInTheDocument();
    expectClean();
  });

  it("the year lands at $28.5B across 365 runs", () => {
    render(<Page3 />);
    dragYear(365);
    // The main total and the combined figure's same-model tile both read $28.5B.
    expect(screen.getAllByText("$28.5B").length).toBeGreaterThan(0);
    expect(screen.getByText(/365 days · 365 runs/)).toBeInTheDocument();
    expectClean();
  });

  it("the combined figure shows year one already beating the flat plan", () => {
    render(<Page3 />);
    // months defaults to 12; the frontier tile reads its year-one compounding total.
    expect(screen.getByText("$45.5B")).toBeInTheDocument();
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

  it("the three milestone chips ride the figure from the start", () => {
    render(<Page3 />);
    expect(screen.getByText(/one GPT-4-class run/)).toBeInTheDocument();
    expect(screen.getByText(/passes Epoch's projected record run/)).toBeInTheDocument();
    expect(screen.getByText(/365 runs for one year of fresh memory/)).toBeInTheDocument();
    expectClean();
  });

  it("citations sit at the bottom of the page", () => {
    render(<Page3 />);
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
    expectClean();
  });
});
