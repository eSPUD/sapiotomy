import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { Page10 } from "./Page10";

const word = (w: string) => screen.getByRole("button", { name: new RegExp(`^${w}\\s`) });
const bill = () =>
  Number(
    screen
      .getByRole("status", { name: /the compute bill/i })
      .querySelector("p")
      ?.textContent?.split("/")[0] ?? "-1",
  );
const pick = (label: RegExp) =>
  fireEvent.click(
    within(screen.getByRole("group", { name: /search strategy/i })).getByRole("button", {
      name: label,
    }),
  );
const skipToEnd = () => fireEvent.click(screen.getByRole("button", { name: /skip to end/i }));
const scrubTo = (v: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /search step/i }), {
    target: { value: String(v) },
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

describe("Page 10 — step 2, the replay", () => {
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

  it("opens dark: nothing scored yet, and an invitation to play", () => {
    render(<Page10 />);
    expect(bill()).toBe(0);
    expect(screen.getByText(/press play to watch it search/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
  });

  it("next advances one word at a time, pausing playback, and stops at the end", () => {
    render(<Page10 />);
    const next = screen.getByRole("button", { name: /next step/i });
    fireEvent.click(next);
    expect(bill()).toBe(1);
    fireEvent.click(next);
    expect(bill()).toBe(2);
    // while playing, next pauses
    fireEvent.click(screen.getByRole("button", { name: /^play$/i }));
    fireEvent.click(next);
    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
    // at the end it disables
    skipToEnd();
    expect(screen.getByRole("button", { name: /next step/i })).toBeDisabled();
    // and MCTS steps by trial, not by word
    pick(/mcts/i);
    expect(screen.getByRole("button", { name: /next trial/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next trial/i }));
    expect(bill()).toBe(9); // trial 1 scored 9 words
  });

  it("play toggles to pause; scrubbing pauses", () => {
    render(<Page10 />);
    fireEvent.click(screen.getByRole("button", { name: /^play$/i }));
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    scrubTo(3);
    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
    expect(bill()).toBe(3);
  });

  it("greedy replayed to the end: 9 of 29 scored, no rhyme", () => {
    render(<Page10 />);
    skipToEnd();
    expect(bill()).toBe(9);
    expect(screen.getByText(/✗ no rhyme/)).toBeInTheDocument();
    expect(screen.getAllByText(/so I got up and paced/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /replay/i })).toBeInTheDocument();
  });

  it("the tree itself never changes across strategies", () => {
    render(<Page10 />);
    const tree = () => screen.getByRole("img", { name: /word tree/i });
    const words = within(tree()).getAllByText(/^[a-z]+$/).length;
    pick(/breadth-first/i);
    expect(within(tree()).getAllByText(/^[a-z]+$/).length).toBe(words);
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
      expect(bill(), `${key} resets`).toBe(0);
      skipToEnd();
      costs[key] = bill();
    }
    expect(costs).toEqual({ greedy: 9, bfs: 23, dfs: 18, mcts: 14 });
  });

  it("narrates the depth-first backtrack at the moment it happens", () => {
    render(<Page10 />);
    pick(/depth-first/i);
    scrubTo(14); // the jump back to "turned" after the whole "got" subtree dies
    expect(screen.getByText(/backed up to "turned"/)).toBeInTheDocument();
  });

  it("narrates breadth-first as a column-by-column sweep", () => {
    render(<Page10 />);
    pick(/breadth-first/i);
    scrubTo(4); // first word of column 2
    expect(screen.getByText(/word 1 scored for every line — extending them all/)).toBeInTheDocument();
  });

  it("animates MCTS by whole trials, with the trace recording each", () => {
    render(<Page10 />);
    pick(/mcts/i);
    expect(screen.getByText(/trial 0\/3/)).toBeInTheDocument();
    scrubTo(1);
    expect(screen.getByText(/trial 1: finished the line — no rhyme/)).toBeInTheDocument();
    expect(screen.getAllByText(/so I got up and paced/).length).toBeGreaterThan(0);
    scrubTo(3);
    expect(bill()).toBe(14);
    expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
  });

  it("beam exposes its dial, and every extra line kept alive costs more", () => {
    render(<Page10 />);
    pick(/^Beam$/);
    const dial = screen.getByRole("slider", { name: /lines kept alive/i });
    skipToEnd();
    expect(bill()).toBe(14); // b = 2 finds the rhyme
    expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
    let last = 14;
    for (const v of ["3", "4", "5"]) {
      fireEvent.change(dial, { target: { value: v } });
      skipToEnd();
      expect(bill(), `b=${v}`).toBeGreaterThan(last);
      last = bill();
    }
  });

  it("every searcher lands on the same rhyme, cheaper or dearer", () => {
    render(<Page10 />);
    for (const label of [/breadth-first/i, /depth-first/i, /mcts/i]) {
      pick(label);
      skipToEnd();
      expect(screen.getByText(/✓ it rhymes/)).toBeInTheDocument();
      expect(screen.getAllByText(/so I turned on the light/).length).toBeGreaterThan(0);
    }
  });

  it("discloses that the words are authored and the replay is the real trace", () => {
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
    expect(kids.at(-1)?.querySelector("a[href*='p/']")).toBeTruthy();
    expect(kids.at(-2)?.textContent).toMatch(/Yao et al\. 2023/);
  });
});
