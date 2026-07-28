import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Page10 } from "./Page10";

const word = (w: string) => screen.getByRole("button", { name: new RegExp(`^${w}\\s`) });
const bill = () =>
  Number(
    screen.getByRole("status", { name: /the compute bill/i }).querySelector("p")?.textContent ?? "0",
  );
const dial = () => screen.getByRole("slider", { name: /lines kept alive/i });
const setStrategy = (value: string) =>
  fireEvent.change(screen.getByRole("combobox", { name: /search strategy/i }), {
    target: { value },
  });

describe("Page 10 — step 1, the reader writes the line", () => {
  it("states the rule and shows the model's next-word candidates", () => {
    render(<Page10 />);
    expect(screen.getByText(/rhyme with “night”/)).toBeInTheDocument();
    expect(screen.getByText(/what the model thinks comes next/i)).toBeInTheDocument();
    expect(word("got")).toBeInTheDocument();
    expect(word("turned")).toBeInTheDocument();
  });

  it("taking the likeliest word every time gives a line that does not rhyme", () => {
    render(<Page10 />);
    for (const w of ["got", "up", "and", "paced"]) fireEvent.click(word(w));
    expect(screen.getByText(/✗ "paced" does not rhyme with "night"/)).toBeInTheDocument();
    expect(screen.getByText(/The line still cannot rhyme\./)).toBeInTheDocument();
  });

  it("the reader can find the one rhyming line", () => {
    render(<Page10 />);
    for (const w of ["turned", "on", "the", "light"]) fireEvent.click(word(w));
    expect(screen.getByText(/✓ "light" rhymes with "night"/)).toBeInTheDocument();
    expect(screen.getByText(/exactly one rhyming line/i)).toBeInTheDocument();
  });

  it("start over clears the line", () => {
    render(<Page10 />);
    fireEvent.click(word("got"));
    expect(screen.getByText(/1 of 4 words/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByText(/0 of 4 words/)).toBeInTheDocument();
  });
});

describe("Page 10 — step 2, the strategies", () => {
  it("opens on greedy, which cannot rhyme, for 12 words scored", () => {
    render(<Page10 />);
    expect(screen.getByRole("combobox", { name: /search strategy/i })).toHaveValue("greedy");
    expect(bill()).toBe(12);
    expect(screen.getByText(/✗ no rhyme/)).toBeInTheDocument();
    // the line appears in the verdict and again in the finished-lines list
    expect(screen.getAllByText(/so I got up and paced/).length).toBeGreaterThan(0);
  });

  it("a beam of two finds the rhyme, and costs more", () => {
    render(<Page10 />);
    setStrategy("beam");
    fireEvent.change(dial(), { target: { value: "2" } });
    expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
    expect(screen.getAllByText(/so I turned on the light/).length).toBeGreaterThan(0);
    expect(bill()).toBe(19);
  });

  it("every extra line kept alive costs more still", () => {
    render(<Page10 />);
    setStrategy("beam");
    fireEvent.change(dial(), { target: { value: "1" } });
    let last = bill();
    for (const v of ["2", "3", "4", "5"]) {
      fireEvent.change(dial(), { target: { value: v } });
      expect(bill(), `keep ${v}`).toBeGreaterThan(last);
      last = bill();
    }
  });

  it("offers all five strategies, and each really runs", () => {
    render(<Page10 />);
    const costs: Record<string, number> = {};
    for (const s of ["greedy", "bfs", "dfs", "beam", "mcts"]) {
      setStrategy(s);
      costs[s] = bill();
      expect(costs[s], s).toBeGreaterThan(0);
    }
    // breadth-first pays the most; greedy the least
    expect(costs.bfs).toBe(43);
    expect(costs.greedy).toBe(12);
    expect(costs.mcts).toBe(23);
    expect(costs.dfs).toBe(29);
  });

  it("shows the beam dial only for beam", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /lines kept alive/i })).not.toBeInTheDocument();
    setStrategy("beam");
    expect(dial()).toBeInTheDocument();
  });

  it("lists the finished lines as readable sentences", () => {
    render(<Page10 />);
    setStrategy("bfs");
    expect(screen.getByText(/lines it finished/i)).toBeInTheDocument();
    expect(screen.getAllByText(/so I turned on the light/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("rhymes").length).toBeGreaterThan(0);
  });
});

describe("Page 10 — step 3 and house style", () => {
  it("cites the crosswords table and never mentions Game of 24", () => {
    const { container } = render(<Page10 />);
    expect(screen.getAllByText(/crossword/i).length).toBeGreaterThan(0);
    expect(container.textContent).not.toMatch(/game of 24/i);
  });

  it("keeps the reference note to a bare cite, as pages 3-8 do", () => {
    render(<Page10 />);
    const note = screen.getByText("References").closest("aside")!;
    expect(note.textContent).toMatch(/Yao et al\. 2023, Tree of Thoughts/);
    expect(note.textContent).not.toMatch(/NeurIPS|Table 3|20 puzzles|arXiv/);
  });

  it("discloses that the words are authored and the search is real", () => {
    render(<Page10 />);
    expect(
      screen.getByText(/written by hand\. The search over them is real/i),
    ).toBeInTheDocument();
  });
});
