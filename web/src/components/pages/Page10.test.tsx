import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Page10 } from "./Page10";

const word = (w: string) => screen.getByRole("button", { name: new RegExp(`^${w}\\s`) });
const bill = () =>
  Number(
    screen
      .getByRole("status", { name: /the compute bill/i })
      .querySelector("p")
      ?.textContent?.split("/")[0] ?? "0",
  );
const pick = (label: RegExp) =>
  fireEvent.click(within(screen.getByRole("group", { name: /search strategy/i })).getByRole("button", { name: label }));

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

describe("Page 10 — step 2, five buttons over one fixed tree", () => {
  it("offers the five strategies as buttons, greedy named as the chain of thought", () => {
    render(<Page10 />);
    const group = screen.getByRole("group", { name: /search strategy/i });
    const labels = within(group)
      .getAllByRole("button")
      .map((b) => b.textContent);
    expect(labels).toEqual([
      "Greedy (chain of thought)",
      "Breadth-first",
      "Depth-first",
      "Beam",
      "MCTS",
    ]);
    expect(within(group).getByRole("button", { name: /greedy/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("frames the searchers as best-of-N with the judge moved inside the loop", () => {
    render(<Page10 />);
    expect(screen.getByText(/best-of-N with the judge moved inside the/i)).toBeInTheDocument();
  });

  it("opens on greedy: 9 of 29 scored, and no rhyme", () => {
    render(<Page10 />);
    expect(bill()).toBe(9);
    expect(screen.getByText(/✗ no rhyme/)).toBeInTheDocument();
    expect(screen.getAllByText(/so I got up and paced/).length).toBeGreaterThan(0);
  });

  it("the tree itself never changes across strategies", () => {
    // every word in the space is rendered regardless of strategy — the
    // strategy only changes what lights up
    render(<Page10 />);
    const tree = () => screen.getByRole("img", { name: /word tree/i });
    const greedyWords = within(tree()).getAllByText(/^[a-z]+$/).length;
    pick(/breadth-first/i);
    expect(within(tree()).getAllByText(/^[a-z]+$/).length).toBe(greedyWords);
    for (const w of ["light", "silence", "groaned", "waited"]) {
      expect(within(tree()).getAllByText(w).length, w).toBeGreaterThan(0);
    }
  });

  it("each strategy pays a different, pinned bill", () => {
    render(<Page10 />);
    const costs: Record<string, number> = {};
    for (const [label, key] of [
      [/greedy/i, "greedy"],
      [/breadth-first/i, "bfs"],
      [/depth-first/i, "dfs"],
      [/mcts/i, "mcts"],
    ] as const) {
      pick(label);
      costs[key] = bill();
    }
    expect(costs).toEqual({ greedy: 9, bfs: 23, dfs: 18, mcts: 14 });
  });

  it("beam exposes its dial, and every extra line kept alive costs more", () => {
    render(<Page10 />);
    expect(screen.queryByRole("slider", { name: /lines kept alive/i })).not.toBeInTheDocument();
    pick(/^Beam$/);
    const dial = screen.getByRole("slider", { name: /lines kept alive/i });
    expect(bill()).toBe(14); // opens at b=2, which rhymes
    expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
    let last = 14;
    for (const v of ["3", "4", "5"]) {
      fireEvent.change(dial, { target: { value: v } });
      expect(bill(), `b=${v}`).toBeGreaterThan(last);
      last = bill();
    }
  });

  it("every searcher lands on the same rhyme, cheaper or dearer", () => {
    render(<Page10 />);
    for (const label of [/breadth-first/i, /depth-first/i, /mcts/i]) {
      pick(label);
      expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
      expect(screen.getAllByText(/so I turned on the light/).length).toBeGreaterThan(0);
    }
  });

  it("discloses that the words are authored and the search is real", () => {
    render(<Page10 />);
    expect(screen.getByText(/written by hand\. The search over them is real/i)).toBeInTheDocument();
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

  it("has no footnote: the page ends at the citation chip", () => {
    const { container } = render(<Page10 />);
    const article = container.querySelector("article")!;
    const kids = [...article.children];
    // last two blocks are the citation chip row and the page nav
    expect(kids.at(-1)?.querySelector("a[href*='p/']")).toBeTruthy();
    expect(kids.at(-2)?.textContent).toMatch(/Yao et al\. 2023/);
  });
});
