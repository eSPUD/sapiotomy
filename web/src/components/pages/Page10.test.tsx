import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page10 } from "./Page10";

const readCount = () =>
  Number(
    screen
      .getByRole("status", { name: /the compute bill/i })
      .querySelector("p")?.textContent ?? "0",
  );

const setStrategy = (value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: /search strategy/i }), {
    target: { value },
  });

describe("Page 10 (searching through thoughts) component", () => {
  it("opens on greedy, which commits to the trap and strands", () => {
    render(<Page10 />);
    expect(screen.getByRole("combobox", { name: /search strategy/i })).toHaveValue("greedy");
    expect(screen.getByText(/stranded/i)).toBeInTheDocument();
    expect(readCount()).toBe(11);
  });

  it("shows the reader the leftover words, not just an assertion of failure", () => {
    render(<Page10 />);
    // IRIS went to "Flowers", so the eye is short a part and HEATHER is homeless.
    for (const w of ["HEATHER", "PUPIL", "LENS", "RETINA"]) {
      expect(screen.getAllByText(w).length, w).toBeGreaterThan(0);
    }
  });

  it("switching to MCTS sorts all sixteen words", () => {
    render(<Page10 />);
    setStrategy("mcts");
    expect(screen.getByText(/all sixteen words placed/i)).toBeInTheDocument();
    expect(readCount()).toBe(21);
  });

  it("exposes the beam-width dial only for the beam strategy", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /beam width/i })).not.toBeInTheDocument();
    setStrategy("beam");
    expect(screen.getByRole("slider", { name: /beam width/i })).toBeInTheDocument();
  });

  it("breadth-first scores more thoughts than MCTS", () => {
    render(<Page10 />);
    setStrategy("mcts");
    const mcts = readCount();
    setStrategy("bfs");
    expect(readCount()).toBeGreaterThan(mcts);
  });

  it("lists the groupings with the model's confidence in each", () => {
    render(<Page10 />);
    // The trap and the correct group it is one word away from are both offered,
    // so the reader can rate them before the search does.
    expect(screen.getAllByText("Flowers").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Flowers that are also girls' names").length).toBeGreaterThan(0);
    expect(screen.getByText("Parts of the eye")).toBeInTheDocument();
    expect(screen.getByText("ROSE · LILY · VIOLET · IRIS")).toBeInTheDocument();
    expect(screen.getByText("ROSE · LILY · VIOLET · HEATHER")).toBeInTheDocument();
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
