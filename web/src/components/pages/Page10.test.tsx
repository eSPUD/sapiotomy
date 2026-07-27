import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page10 } from "./Page10";

const readCount = () =>
  Number(
    screen.getByRole("status", { name: /the compute bill/i }).querySelector("p")?.textContent ?? "0",
  );

const setStrategy = (value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: /search strategy/i }), {
    target: { value },
  });

describe("Page 10 (searching through thoughts) component", () => {
  it("opens on greedy, which writes the answer it likes best and jams", () => {
    render(<Page10 />);
    expect(screen.getByRole("combobox", { name: /search strategy/i })).toHaveValue("greedy");
    // "jammed" is also a legend label, so match the verdict line specifically.
    expect(screen.getByText(/✗ jammed/)).toBeInTheDocument();
    expect(readCount()).toBe(16);
  });

  it("names the clue-breaking entries instead of just asserting failure", () => {
    render(<Page10 />);
    // Down reads LOT / IRE / DEN — real words, wrong answers.
    for (const w of ["LOT", "IRE", "DEN"]) {
      expect(screen.getAllByText(w).length, w).toBeGreaterThan(0);
    }
    // the clue appears both in the clue list and in the jam report
    expect(screen.getAllByText(/Camp bed/).length).toBeGreaterThan(1);
  });

  it("switching to MCTS finishes the grid, for fewer thoughts than breadth-first", () => {
    render(<Page10 />);
    setStrategy("mcts");
    expect(screen.getByText(/every clue answered/i)).toBeInTheDocument();
    const mcts = readCount();
    expect(mcts).toBe(30);
    setStrategy("bfs");
    expect(readCount()).toBeGreaterThan(mcts);
  });

  it("exposes the beam-width dial only for the beam strategy", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /beam width/i })).not.toBeInTheDocument();
    setStrategy("beam");
    expect(screen.getByRole("slider", { name: /beam width/i })).toBeInTheDocument();
  });

  it("shows each clue with the answers the model would write", () => {
    render(<Page10 />);
    expect(screen.getByText("Bottle top")).toBeInTheDocument();
    expect(screen.getAllByText("LID").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CAP").length).toBeGreaterThan(0);
  });

  it("offers the plain chain-of-thought contrast", () => {
    render(<Page10 />);
    fireEvent.click(screen.getByRole("button", { name: /solve with plain cot/i }));
    expect(screen.getByText(/no branching/i)).toBeInTheDocument();
  });

  it("cites the crosswords table and never mentions Game of 24", () => {
    const { container } = render(<Page10 />);
    expect(screen.getAllByText(/crossword/i).length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/game of 24/i);
  });

  it("carries the authored-not-live disclosure as a sidenote", () => {
    render(<Page10 />);
    expect(screen.getByText(/authored, not live/i)).toBeInTheDocument();
  });
});
