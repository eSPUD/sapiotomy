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
  it("states the rule in the copy, so the reader knows the criterion", () => {
    render(<Page10 />);
    expect(screen.getAllByText(/shaded column/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Gratuity/)).toBeInTheDocument();
  });

  it("opens on greedy, whose column reads SIP", () => {
    render(<Page10 />);
    expect(screen.getByRole("combobox", { name: /search strategy/i })).toHaveValue("greedy");
    expect(screen.getByText(/✗ the column reads SIP/)).toBeInTheDocument();
    expect(readCount()).toBe(12);
  });

  it("says why SIP is wrong rather than just asserting failure", () => {
    render(<Page10 />);
    expect(screen.getByText(/SIP is a word\. The clue asked for a gratuity\./)).toBeInTheDocument();
  });

  it("labels each tree node with the answer that branch wrote", () => {
    // Grids are deduplicated, so a node must show the write on ITS path, not
    // whichever write first reached that grid. The answer is TOT / INN / PEN,
    // so a solved run's tree must contain a TOT node.
    render(<Page10 />);
    setStrategy("mcts");
    expect(screen.getAllByText("TOT").length).toBeGreaterThan(1);
  });

  it("MCTS finishes it, for fewer thoughts than breadth-first", () => {
    render(<Page10 />);
    setStrategy("mcts");
    expect(screen.getByText(/✓ the column reads TIP/)).toBeInTheDocument();
    const mcts = readCount();
    expect(mcts).toBe(16);
    setStrategy("bfs");
    expect(readCount()).toBeGreaterThan(mcts);
  });

  it("exposes the beam-width dial only for the beam strategy", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /beam width/i })).not.toBeInTheDocument();
    setStrategy("beam");
    expect(screen.getByRole("slider", { name: /beam width/i })).toBeInTheDocument();
  });

  it("shows all three clues with both candidate answers and a reason", () => {
    render(<Page10 />);
    expect(screen.getByText("Add up")).toBeInTheDocument();
    expect(screen.getAllByText("SUM").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TOT").length).toBeGreaterThan(0);
    expect(screen.getByText(/nobody says it any more/i)).toBeInTheDocument();
  });

  it("states the scoring rule, so the dots are not arbitrary", () => {
    render(<Page10 />);
    expect(screen.getByText(/how sure the model is that an answer fits/i)).toBeInTheDocument();
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
