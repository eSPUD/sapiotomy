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

  it("carries both references as RefItem entries in the margin notes, as page 3 does", () => {
    render(<Page10 />);
    const notes = screen.getAllByText("References").map((el) => el.closest("aside")!);
    expect(notes).toHaveLength(2);
    const all = notes.map((n) => n.textContent).join(" | ");
    expect(all).toMatch(/Holtzman et al\. 2020, The Curious Case of Neural Text Degeneration/);
    expect(all).toMatch(/Yao et al\. 2023, Tree of Thoughts/);
    // venue is fine (page-3 house style); no table number, sample size or arXiv id in a note
    expect(all).not.toMatch(/Table 1|Table 3|20 puzzles|GPT-2|arXiv/);
  });

  it("anchors the trap in Holtzman's measured numbers, beside step 1", () => {
    render(<Page10 />);
    expect(
      screen.getByText(/gets"?\s*stuck repeating a phrase in 73\.66% of its continuations/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Human text:\s*0\.28%/)).toBeInTheDocument();
  });

  it("step 3 owns why the five buttons cannot have a literature chart", () => {
    render(<Page10 />);
    // The concession is not breadth-first alone: of the five, only greedy and beam
    // survive contact with a real reasoning tree.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/only greedy and beam stay practical/i);
    expect(body).toMatch(/depth-first cannot tell a line is doomed without finishing it/i);
    expect(body).toMatch(/MCTS needs thousands of finished lines per question/i);
    expect(body).toMatch(/not a verdict on the algorithms/i);
  });

  // The page's scorer is the model's own confidence, not page 8's second-model
  // verifier; the punchline (the rhyme the likelihood passed over) needs that.
  it("never calls the model's own confidence a verifier", () => {
    const { container } = render(<Page10 />);
    expect(container.textContent).not.toMatch(/verifier/i);
    expect(screen.getByText(/here the judge is the model’s own confidence/i)).toBeInTheDocument();
    expect(screen.getByText(/words the model rated/i)).toBeInTheDocument();
  });

  // Nothing on the page prices backtracking against pruning.
  it("does not price backtracking against pruning", () => {
    const { container } = render(<Page10 />);
    expect(container.textContent).not.toMatch(/more expensive half/i);
    expect(screen.getByText(/What that costs is the trade the rest of this act is about/)).toBeInTheDocument();
  });

  // Five bars, so "the two middle bars" points at the wrong pair.
  it("names the bars that matter instead of pointing by position", () => {
    const { container } = render(<Page10 />);
    expect(container.textContent).not.toMatch(/two middle bars/i);
    expect(container.textContent).toMatch(/two bars with a piece switched off/i);
  });

  // Pages 5 to 9 lay a step out as heading, setup prose in the page column, then a
  // labelled region holding the figure and nothing else, with the caption unboxed
  // underneath. Page 10 used to put all of it inside one box per step, so the border
  // meant "this step" rather than "this figure".
  it("keeps setup prose and captions outside the figure regions, as pages 5 to 9 do", () => {
    render(<Page10 />);
    const step = (heading: RegExp) =>
      screen.getByRole("heading", { name: heading, level: 2 }).parentElement!;
    const figure = (label: RegExp) =>
      screen.getByRole("region", { name: label }) as HTMLElement;

    // Each step announces its figure as a region, and the region holds the apparatus.
    const couplet = figure(/four words missing/i);
    const replay = figure(/replayed under each search strategy/i);
    const crosswords = figure(/crosswords/i);
    expect(within(couplet).getByRole("button", { name: /^got\s/ })).toBeInTheDocument();
    expect(within(replay).getByRole("group", { name: /search strategy/i })).toBeInTheDocument();
    expect(within(crosswords).getByRole("img", { name: /percentage of crossword words/i })).toBeInTheDocument();

    // The invitation is the last line of the intro, above the box, not inside it.
    expect(couplet.textContent).not.toMatch(/Tap a word to add it/);
    expect(step(/finish the line/i).textContent).toMatch(/Tap a word to add it/);
    expect(replay.textContent).not.toMatch(/Pick one and press play/);
    expect(step(/search the same tree/i).textContent).toMatch(/Pick one and press play/);

    // Captions sit under their figure, in the page column.
    expect(couplet.textContent).not.toMatch(/The trap is not a toy/);
    expect(replay.textContent).not.toMatch(/written by hand\. The search over them is real/);
    expect(crosswords.textContent).not.toMatch(/Chain of thought fills/);
    expect(crosswords.textContent).not.toMatch(/head-to-head on a real model is out of reach/);
  });

  it("links each reference from its RefItem entry, not a footer chip", () => {
    render(<Page10 />);
    expect(screen.getByRole("link", { name: /Yao et al\. 2023/ })).toHaveAttribute(
      "href",
      expect.stringContaining("2305.10601"),
    );
    expect(screen.getByRole("link", { name: /Holtzman et al\. 2020/ })).toHaveAttribute(
      "href",
      expect.stringContaining("1904.09751"),
    );
  });

  it("has no footer chips: the page ends on nav, references live in the margin notes", () => {
    const { container } = render(<Page10 />);
    const article = container.querySelector("article")!;
    const kids = [...article.children];
    // Last child is the page nav; everything above it is the one grid, and the
    // handoff card is that grid's last cell rather than a full-width block below
    // it (page 3's shape, adopted 2026-08-10) — no citation-chip row anywhere.
    expect(kids.at(-1)?.querySelector("a[href*='p/']")).toBeTruthy();
    // Located by a note rather than by position, so moving the handoff cannot
    // silently retarget this at the wrong element.
    const grid = screen.getAllByText("References")[0].closest("div.grid")!;
    expect(kids.at(-2)).toBe(grid);
    expect(grid.textContent).toMatch(/Yao et al\. 2023/);
    expect(grid.textContent).toMatch(/Holtzman et al\. 2020/);
    // the References notes live inside the grid; no bare link chips follow it
    expect(grid.querySelector('aside a[href*="arxiv"]')).toBeTruthy();
    const handoff = screen
      .getByText(/Everything on pages 5 to 10 spends the same thing/)
      .closest("div")!;
    expect([...grid.children].at(-1)).toBe(handoff);
    expect(handoff.textContent).toMatch(/Turn the page\./);
    expect(handoff.querySelector("a")).toBeNull();
  });

  // Pages 5 to 9 each hand the next one a question. This page's last content sentence
  // used to be inside a caption, leaving page 11 to open the seam on its own.
  it("closes with the handoff to page 11, in the currency page 11 uses", () => {
    render(<Page10 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/arithmetic at answer time/);
    expect(body).toMatch(/which is the better buy at a matched bill/);
  });

  // MCTS is load-bearing here and glossed nowhere else in the deck. The blurb is the
  // first thing a reader gets after pressing the button, so the acronym opens there.
  it("spells out MCTS where the reader meets the button", () => {
    render(<Page10 />);
    fireEvent.click(screen.getByRole("button", { name: /^MCTS$/ }));
    expect(document.body.textContent).toMatch(/Monte Carlo tree search/);
  });

  // Pages 5 to 9 train the reader to download the run behind the numbers. This page
  // has no run, so the download has to promise the notebook and the page has to say
  // outright that nothing here was measured by us. Both halves are pinned, because
  // shipping one without the other is worse than shipping neither: the download in
  // page 5-9's position implies a run that does not exist.
  it("offers the search arm and labels it as unrun", () => {
    render(<Page10 />);
    const link = screen.getByRole("link", { name: /search arm, written and not run/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-10-search-arm.zip");
    expect(link).toHaveAttribute("download");
  });

  it("says outright that the page carries no measurement of its own", () => {
    render(<Page10 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/Pages 5 to 9 each ship the run their numbers come from\./);
    expect(body).toMatch(/This page ships none\./);
    // the two things a reader could mistake for our measurements, named as what they are
    expect(body).toMatch(/29-word tree is written by hand/);
    expect(body).toMatch(/bars above are Yao et al\./);
    // Why it was not run belongs to step 3's prose, not the note: the note names what
    // the page carries and stops. The margin used to carry the arm's size and which
    // strategies would survive, which is the page's longest note about its own absence.
    expect(body).not.toMatch(/21 GB/);
    expect(body).toMatch(/only greedy and beam stay practical/);
  });
});
