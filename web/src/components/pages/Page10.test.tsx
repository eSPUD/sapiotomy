import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page10 } from "./Page10";

describe("Page 10 (searching through thoughts) component", () => {
  it("opens on greedy, which strands at the bridgeless peninsula", () => {
    render(<Page10 />);
    expect(screen.getByRole("combobox", { name: /search strategy/i })).toHaveValue("greedy");
    expect(screen.getByText(/stranded at Ferry Landing/i)).toBeInTheDocument();
  });

  it("switching to MCTS finds a route to the destination", () => {
    render(<Page10 />);
    fireEvent.change(screen.getByRole("combobox", { name: /search strategy/i }), {
      target: { value: "mcts" },
    });
    expect(screen.getByText(/✓ arrived/)).toBeInTheDocument();
  });

  it("exposes the beam-width dial only for the beam strategy", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /beam width/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: /search strategy/i }), {
      target: { value: "beam" },
    });
    expect(screen.getByRole("slider", { name: /beam width/i })).toBeInTheDocument();
  });

  it("breadth-first examines more towns than MCTS", () => {
    const readCount = () =>
      Number(screen.getByText(/towns examined/i).previousElementSibling?.textContent ?? "0");
    render(<Page10 />);
    const select = screen.getByRole("combobox", { name: /search strategy/i });
    fireEvent.change(select, { target: { value: "mcts" } });
    const mcts = readCount();
    fireEvent.change(select, { target: { value: "bfs" } });
    expect(readCount()).toBeGreaterThan(mcts);
  });

  it("offers the plain chain-of-thought contrast", () => {
    render(<Page10 />);
    fireEvent.click(screen.getByRole("button", { name: /solve with plain cot/i }));
    expect(screen.getByText(/no branching/i)).toBeInTheDocument();
  });
});
