import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default: no Play button, the walkthrough is a manual
// stepper, and every assertion is timer-free. The animated block below flips
// it OFF to cover Play's auto-advance.
let reducedMotion = true;
const mm = (q: string) => ({
  matches: reducedMotion && q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page4 } from "./Page4";
import { MULT_METHODS } from "@/lib/authored";

const M = MULT_METHODS;

// Act 1's hard rule now covers this page too: the Act 2+ jargon never appears.
const BANNED = /inference/i;
const expectClean = () => {
  expect(document.body.textContent ?? "").not.toMatch(BANNED);
};

const methodSelect = () => screen.getByRole("combobox", { name: /method/i });
const pick = (key: string) => fireEvent.change(methodSelect(), { target: { value: key } });
const next = () => fireEvent.click(screen.getByRole("button", { name: /next/i }));
const walk = (n: number) => {
  for (let i = 0; i < n; i++) next();
};

describe("Page 4 (Reasoning in Multiplication)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows everything up front: dropdown, panel, meaning band, open questions", () => {
    render(<Page4 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Reasoning in Multiplication",
    );
    // The dropdown carries all three roads.
    expect(methodSelect()).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    // No pop-ups: the meaning band and the finale are on from first paint —
    // each method's name shows in its option AND its meaning card.
    for (const m of [M.standard, M.lines, M.vedic]) {
      expect(screen.getAllByText(m.name).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(new RegExp(m.limitation.slice(0, 24))).length).toBeGreaterThan(0);
    }
    expect(screen.getByText(/Three journeys, one destination/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Reasoning is inherently diverse pathfinding from prior knowledge/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/guide a machine down different roads/i)).toBeInTheDocument();
    expect(screen.getByText(/chart its own road/i)).toBeInTheDocument();
    // The walkthrough waits at its setup step.
    expect(screen.getByText("step 0 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Press Next/).length).toBeGreaterThan(0);
    expectClean();
  });

  it("reduced motion hides Play: the walkthrough is a manual stepper", () => {
    render(<Page4 />);
    expect(screen.queryByRole("button", { name: /play/i })).toBeNull();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("standard: four steps land the partial products on 223,300", () => {
    render(<Page4 />);
    walk(1);
    expect(screen.getAllByText(M.standard.rows[0].say).length).toBeGreaterThan(0);
    walk(3);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expectClean();
  });

  it("lines: six steps count the crossings and carry to 223,300", () => {
    render(<Page4 />);
    pick("lines");
    expect(screen.getByText("step 0 of 6")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /line multiplication/i })).toBeInTheDocument();
    walk(2);
    // Tens column: the 40-crossing count is narrated.
    expect(screen.getAllByText(M.lines.diagonals[1].say).length).toBeGreaterThan(0);
    walk(4);
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/carry the columns → 223,300/)).toBeInTheDocument();
    expectClean();
  });

  it("vedic: six crosswise steps write the digits right to left", () => {
    render(<Page4 />);
    pick("vedic");
    walk(3);
    // Hundreds column: the three-way crosswise sum with its carry.
    expect(screen.getAllByText(M.vedic.columns[2].say).length).toBeGreaterThan(0);
    expect(screen.getByText(/3×8 \+ 5×3 \+ 0×6 = 39/)).toBeInTheDocument();
    walk(3);
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/= 223,300/)).toBeInTheDocument();
    expectClean();
  });

  it("switching method resets the walkthrough to its setup step", () => {
    render(<Page4 />);
    walk(2);
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    pick("lines");
    expect(screen.getByText("step 0 of 6")).toBeInTheDocument();
    expect(screen.getAllByText(/Press Next/).length).toBeGreaterThan(0);
    // The selected road's limitation rides the panel.
    expect(screen.getAllByText(new RegExp(M.lines.limitation.slice(0, 24))).length).toBeGreaterThan(0);
    expectClean();
  });

  it("back walks the road in reverse", () => {
    render(<Page4 />);
    walk(3);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(M.standard.rows[1].say).length).toBeGreaterThan(0);
  });

  it("never says the banned word on any road at any step", () => {
    render(<Page4 />);
    for (const key of ["standard", "lines", "vedic"]) {
      pick(key);
      for (let i = 0; i < 6; i++) {
        expectClean();
        const btn = screen.getByRole("button", { name: /next/i });
        if ((btn as HTMLButtonElement).disabled) break;
        fireEvent.click(btn);
      }
      expectClean();
    }
  });
});

// The animated path: reduced motion OFF with fake timers, so Play auto-advances
// the walkthrough to the landing and then stops.
describe("Page 4 animated Play (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  /** Each play tick re-arms its timeout in an effect, so flush act() per tick. */
  const tick = (n: number) => {
    for (let i = 0; i < n; i++) {
      act(() => {
        vi.advanceTimersByTime(900 + 20);
      });
    }
  };

  it("Play walks the standard road to the landing, then stops", () => {
    render(<Page4 />);
    const play = screen.getByRole("button", { name: /play/i });
    fireEvent.click(play);
    // Two ticks in: mid-walkthrough.
    tick(2);
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    // Play out the rest: it reaches the landing and stops advancing.
    tick(3);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
    // No stray timer keeps stepping past the end.
    tick(5);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
  });

  it("pressing Next mid-play takes over from the auto-advance", () => {
    render(<Page4 />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    tick(1);
    expect(screen.getByText("step 1 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    // The manual press paused the run: time passing no longer advances it.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
  });
});
