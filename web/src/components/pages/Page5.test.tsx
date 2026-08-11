import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

// Reduced motion is ON by default so the chain steps deterministically via the
// Next button (Play is hidden under reduced motion). The animated block at the
// bottom flips it OFF to cover Play's step-by-step streaming.
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

import { Page5 } from "./Page5";
import { SYSTEMS } from "@/lib/authored";
import { PAGE5, SUPPRESSION_TABLE, tidyMath } from "@/lib/page05";

const BLURT = PAGE5.figure1.tabs[0];
const BARE = PAGE5.figure1.tabs[1];

const body = () => document.body.textContent ?? "";
const nextBtn = () => screen.getByRole("button", { name: /next ▸/i });
const bareTab = () => screen.getByRole("button", { name: /the question alone/i });
const blurtTab = () => screen.getByRole("button", { name: /working forbidden/i });

/** Walk the whole trace via Next presses (reduced motion → no Play). */
function walk(steps: number) {
  for (let i = 0; i < steps; i++) fireEvent.click(nextBtn());
}

// The page defines its own term before it measures it, and the definition is
// built out of what the deck already gave the reader (page 1's two speeds, page
// 4's roads) rather than out of a citation.
describe("Page 5, step 1: what a chain of thought is", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("defines the term before any figure", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toContain("What a chain of thought is");
    expect(body()).toContain("you did not recognise the answer, you built it");
    expect(body()).toContain("a thread of steps running from the question to the goal");
  });

  // The callback is page 1's round, read off SYSTEMS rather than retyped, so
  // editing page 1's worked example cannot leave page 5 quoting numbers the
  // reader never saw.
  it("calls back to page 1 with page 1's own numbers", () => {
    render(<Page5 />);
    expect(body()).toContain(SYSTEMS.slow.prompt);
    expect(body()).toContain("you built it: 340, then 68, then 408");
  });

  // The load-bearing half of the definition, and the only unmeasured claim in
  // the step: the chain is the thinking, which is what makes it something the
  // rest of the act can budget, sample, vote on and score.
  it("says the chain is the thinking rather than a report of it", () => {
    render(<Page5 />);
    expect(body()).toContain("the thread is not a report of the thinking");
    expect(body()).toContain("it is the thinking");
    expect(body()).toContain("every step is text the model has to write before it can write");
  });

  // The page turns on the ask having stopped being necessary, which a reader
  // cannot feel unless the ask is named first. The phrase is the one the cited
  // paper published, because the marker sits on it; the run's own instruction
  // suffix is a different string and its arm is not on the page.
  it("names the classic ask in the words the cited paper published", () => {
    render(<Page5 />);
    expect(body()).toContain("The classic way to get one is to ask");
    expect(body()).toContain("Let's think step by step.");
    expect(body()).not.toContain(PAGE5.manifest.conditions.zero_shot_cot.trim());
  });

  // Pages 1 to 3's grammar: the marker sits on the claim, and the entry sits in
  // a right-hand References sidenote beside the step, with the number tying the
  // two together.
  it("marks the two techniques in the prose and resolves them in a References sidenote", () => {
    render(<Page5 />);
    expect(screen.queryByText(/cited for the technique/i)).not.toBeInTheDocument();

    // Two markers on the definition step, numbered in order of appearance.
    const step = screen.getByText(/The classic way to get one is to ask/).closest("p")!;
    expect(Array.from(step.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
      "reference 1",
      "reference 2",
    ]);

    // Both entries live in the first right-hand References sidenote, beside
    // this step. (The second References sidenote sits beside the close.)
    const refs = screen.getAllByText("References")[0].closest("aside")!;
    expect(within(refs).getByRole("link", { name: /Wei et al. 2022/ })).toBeInTheDocument();
    expect(within(refs).getByRole("link", { name: /Kojima et al. 2022/ })).toBeInTheDocument();
  });
});

describe("Page 5, figure 1: the chain is already there", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("lands on the bare prompt with nothing revealed yet", () => {
    render(<Page5 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Chain of Thought: Reasoning Out Loud",
    );
    expect(bareTab()).toHaveAttribute("aria-pressed", "true");
    expect(blurtTab()).toHaveAttribute("aria-pressed", "false");
    expect(body()).toContain(`0 of ${BARE.tokensGenerated} tokens written`);
    expect(screen.queryByText(tidyMath(BARE.steps[0].text))).toBeNull();
  });

  /**
   * The terminology floor. Page 5 is the deck's first measured page, and every
   * number from here to page 16 is counted in tokens, taken from a checkpoint,
   * and decoded greedily. None of the three was defined anywhere in the deck
   * until 2026-08-10: `greedy` reached a reader first inside a provenance chip
   * and `checkpoint` first inside a chart's aria-label, neither of which can
   * hold a gloss. The audience is first-year undergraduates with no ML
   * background, so these three carry five later pages and must not be trimmed
   * away as the page tightens.
   */
  it("defines token, greedy and checkpoint, since every later number is denominated in them", () => {
    render(<Page5 />);
    const t = body();
    expect(t).toMatch(/A token is a word-piece, the unit a model writes one at a time/i);
    expect(t).toMatch(/takes its single most likely next token/i);
    expect(t).toMatch(/one saved set of a model's trained numbers/i);
  });

  it("glosses greedy in prose, not only in the provenance chip that cannot hold one", () => {
    render(<Page5 />);
    // The chip is provenance and stays; what matters is that the gloss reaches
    // the reader somewhere a sentence can actually explain it.
    expect(body()).toContain("bf16");
    const gloss = screen.getByText(/single most likely next token/i);
    expect(gloss.closest("p")).not.toBeNull();
    // And it says what greedy buys the reader: the trace below is not a lucky draw.
    expect(gloss.textContent).toMatch(/the same prompt always produces the same chain/i);
  });

  // The step's premise, and the reason its heading is "what it looks like"
  // rather than a claim: the technique is not being demonstrated here, it is
  // already in the weights and the figure is a look at what that produces.
  it("says the model does this natively before showing the trace", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[1]).toContain("What it looks like");
    expect(body()).toContain("does this natively");
    expect(body()).toContain(`writes ${BARE.tokensGenerated} tokens of chain before it answers`);
  });

  // The trace and the prompt are listings of what a machine read and wrote, so
  // they take the deck's one licensed non-serif face. The broadsheet serif is
  // unreadable at 573 tokens of half-LaTeX.
  it("sets the prompt and the revealed trace in mono", () => {
    const { container } = render(<Page5 />);
    expect(container.querySelector("p.font-code")?.textContent).toBe(tidyMath(PAGE5.figure1.question));
    walk(1);
    const revealed = container.querySelector("ol > li");
    expect(revealed?.textContent).toContain(tidyMath(BARE.steps[0].text));
    expect(revealed?.className).toContain("font-code");
    expect(container.querySelector("pre")?.className).toContain("font-code");
  });

  it("walks the model's own output to a correct answer it was never asked to work for", () => {
    render(<Page5 />);
    walk(BARE.steps.length);
    expect(screen.getByText(tidyMath(BARE.steps[0].text))).toBeInTheDocument();
    expect(screen.getByText(tidyMath(BARE.steps[BARE.steps.length - 1].text))).toBeInTheDocument();
    expect(body()).toContain(`it answered ${BARE.extractedAnswer}`);
    expect(body()).toContain(`${BARE.tokensGenerated} tokens · ${BARE.steps.length} steps`);
    expect(body()).toContain(`${BARE.tokensGenerated} of ${BARE.tokensGenerated} tokens written`);
  });

  it("switching to the forbidden prompt resets the walk and lands wrong", () => {
    render(<Page5 />);
    walk(BARE.steps.length);
    fireEvent.click(blurtTab());
    expect(screen.queryByText(tidyMath(BARE.steps[0].text))).toBeNull();
    walk(BLURT.steps.length);
    expect(body()).toContain(`it answered ${BLURT.extractedAnswer}`);
    expect(body()).toContain(`and the answer is ${PAGE5.figure1.groundTruth}`);
    expect(body()).toContain(`${BLURT.tokensGenerated} tokens · 1 step`);
  });

  // The disclosure is the page's evidence that only the prompt moved: the stem
  // is shared and the whole manipulation is the highlighted suffix.
  it("shows the exact prompt of whichever condition is selected", () => {
    render(<Page5 />);
    expect(screen.getByText(/see the full prompt/i)).toBeInTheDocument();
    expect(body()).toContain(PAGE5.figure1.promptStem.trim().slice(0, 40));
    expect(body()).toContain("The prompt ends there. Nothing in it asks for working.");
    expect(body()).not.toContain(BLURT.promptAfter.trim());

    fireEvent.click(blurtTab());
    expect(body()).toContain(BLURT.promptAfter.trim());
    expect(body()).toContain("Highlighted: the whole of the manipulation.");
  });
});

describe("Page 5, figure 2: the cost of forbidding the working", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // "43" is not a claim. "43 of the same 100" is, so the intro carries the denominator
  // and the free-run score. It does NOT carry the gagged score: that is what the switch
  // is for, and an intro that gives both endpoints leaves the figure nothing to deliver.
  it("sets up the contrast with the denominator, and withholds the gagged score", () => {
    render(<Page5 />);
    expect(body()).toContain(
      `solves ${PAGE5.figure2.bare.nCorrect} of the ${PAGE5.figure2.bare.n}`,
    );
    expect(body()).toContain("the same model, reasoning against non-reasoning");
    expect(body()).toContain(`Each square below is one of those ${PAGE5.figure2.bare.n} problems`);
    const intro = screen.getByText(/One trace proves nothing/).textContent ?? "";
    expect(intro).not.toContain(`solves ${PAGE5.figure2.blurt.nCorrect}`);
  });

  it("starts with the model reasoning and flips to the floor", () => {
    render(<Page5 />);
    const fig2 = screen.getByLabelText("The cost of forbidding the working");
    expect(body()).toContain(`solved, of the same ${PAGE5.figure2.bare.n} problems`);
    expect(within(fig2).getByText(String(PAGE5.figure2.bare.nCorrect))).toBeInTheDocument();
    expect(body()).toContain(`median ${PAGE5.figure2.bare.medianTokens} tokens written`);

    fireEvent.click(screen.getByRole("button", { name: "non-reasoning" }));
    expect(within(fig2).getByText(String(PAGE5.figure2.blurt.nCorrect))).toBeInTheDocument();
    expect(body()).toContain(`median ${PAGE5.figure2.blurt.medianTokens} tokens written`);
    expect(body()).toContain(
      `${SUPPRESSION_TABLE.afterOnly} problems it had are gone. ${SUPPRESSION_TABLE.beforeOnly} it did not have arrive.`,
    );
  });

  // Paired, and printed as such: the discordant counts sit beside the contrast
  // so a reader never reads a paired result as two independent bars.
  // ...once the switch has been pressed. The figure's job is to show what leaves, so
  // the cost and its test arrive with the reveal rather than above an untouched control.
  it("prints the paired contrast with its discordant count and p-value", () => {
    render(<Page5 />);
    expect(body()).not.toContain("Forbidding the working costs");
    fireEvent.click(screen.getByRole("button", { name: "non-reasoning" }));
    expect(body()).toContain(
      `Forbidding the working costs ${PAGE5.figure2.suppression.deltaPts} points`,
    );
    expect(body()).toContain("exact McNemar");
    expect(body()).toContain("p < 0.0001");
    // The discordant count is the whole basis of the test, so it stays on the page.
    // The name is now a citation and the sentence beside it says what was compared.
    expect(body()).toContain(
      `looks only at the ${SUPPRESSION_TABLE.afterOnly + SUPPRESSION_TABLE.beforeOnly} where they differ`,
    );
    expect(body()).toContain(
      `reasoning wins ${SUPPRESSION_TABLE.afterOnly} of those and loses ${SUPPRESSION_TABLE.beforeOnly}`,
    );
  });

  it("shows the exact gag string, since one phrasing is all it is", () => {
    render(<Page5 />);
    fireEvent.click(screen.getByRole("button", { name: "non-reasoning" }));
    expect(body()).toContain("Give only the final answer.");
  });

  it("says the cells are arrangement and the counts are measurement", () => {
    render(<Page5 />);
    expect(body()).toContain("which square a problem sits in is arrangement, not data");
  });
});

describe("Page 5, figure 3: the floor is flat", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // The bars get longer going down for a reason that is not this figure's
  // subject, so the intro says so and tells the reader what to discount.
  it("says why a third figure exists and which end of the bars to read", () => {
    render(<Page5 />);
    expect(body()).toContain("Maybe the 3B is just an odd checkpoint");
    expect(body()).toContain("what it still gets right with the working forbidden");
    expect(body()).toContain("Bigger models are better at maths, so the bars get longer");
    expect(body()).toContain("Watch where the left piece ends instead");
  });

  it("compares named checkpoints and never puts size on an axis", () => {
    render(<Page5 />);
    expect(body()).toContain("A non-reasoning 7B solves 11%");
    expect(body()).toContain("A reasoning 1.5B solves 22%");
    expect(body()).toContain("Three checkpoints are not a scaling law");
    // The emergence claim and the redrawn PaLM chart left the page with the
    // premise. Our trend is smooth and monotone; a sign flip is not in it.
    expect(body()).not.toMatch(/emergen/i);
    expect(body()).not.toMatch(/PaLM/i);
  });

  // The cross-model line is the weakest result on the page (p = 0.043, on 25
  // discordant problems) and it used to be its boldest sentence. It now hedges
  // in proportion, next to the suppression result it is weaker than.
  it("hedges the cross-model claim against the headline it is weaker than", () => {
    render(<Page5 />);
    expect(body()).toContain("on the thinnest evidence the page has");
    expect(body()).toContain("p = 0.043");
    expect(body()).toContain("Take this one as a hint; the flat floor is the finding.");
  });
});

// The close was three stat cards quoting one unnamed checkpoint, one of them a
// ×95.5 "trade". It is now a scatter: six cells, every one of them named.
describe("Page 5, figure 4: what each checkpoint wrote against what it solved", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("names the checkpoint every figure above it was measured on", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[4]).toContain("What each checkpoint wrote, and what it solved");
    expect(body()).toContain("Figures 1 and 2 are one checkpoint, the 3B");
  });

  // Six dots, and the axes they sit on, in the chart's own accessible title:
  // a reader on a screen reader gets the same six cells as a reader with eyes.
  it("plots all three checkpoints under both prompts", () => {
    render(<Page5 />);
    const chart = screen.getByLabelText(/Median tokens written against the share/);
    const title = chart.getAttribute("aria-label") ?? "";
    for (const m of PAGE5.figure3.models) {
      expect(title).toContain(`${m.blurtMedianTokens} tokens and ${Math.round(m.blurtAccuracy * 100)}%`);
      expect(title).toContain(`${m.bareMedianTokens} tokens and ${Math.round(m.bareAccuracy * 100)}%`);
    }
    expect(title).toContain("Non-reasoning");
    expect(title).toContain("Reasoning");
  });

  // The reading the figure supports: the horizontal axis is set by the prompt,
  // the vertical one by the model. Read off the data, so it cannot drift.
  it("reads the two axes off the run rather than asserting a rate", () => {
    render(<Page5 />);
    const rows = PAGE5.figure3.models;
    expect(body()).toContain(`a median of ${rows.map((m) => m.bareMedianTokens).join(", ")} tokens`);
    expect(body()).toContain("The tokens move with the prompt; the accuracy moves with the model");
  });

  // The claim the page is not allowed to make, and the words that stop a reader
  // making it for us.
  it("does not price the tokens, and says why the dots are not joined", () => {
    render(<Page5 />);
    expect(body()).toContain("The dots are not joined");
    expect(body()).toContain("nothing here says the longer answers are better because they are longer");
    expect(body()).not.toContain("the trade");
    expect(body()).not.toContain(`×${PAGE5.close.token_multiple}`);
  });
});

describe("Page 5: provenance and what the page may claim", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // The pipeline's whole claim: a reader who doubts a figure re-derives it.
  // The link sits at the top right of the page, on the act kicker's row.
  it("links the notebook, the harness and the traces as one download, at the top", () => {
    render(<Page5 />);
    const link = screen.getByRole("link", { name: /download the notebook, the harness and all/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-05-how-to-reason.zip");
    expect(link).toHaveAttribute("download");
    expect(link.parentElement?.textContent).toContain("Act 2");
  });

  // The run's vitals moved off the top plate (jargon before the reader has met
  // a token cap) into a ledger inside the close's figure card, where they have
  // the card's width instead of a margin column that wrapped the run id.
  it("names the instrument on the page, in a ledger inside the close's figure", () => {
    render(<Page5 />);
    const card = screen.getByLabelText("Tokens written against problems solved");
    const vitals = card.querySelector("dl")?.textContent ?? "";
    expect(vitals).toContain("Qwen2.5-Instruct · 1.5B, 3B, 7B");
    expect(vitals).toContain("MATH-500 levels 4 and 5");
    expect(vitals).toContain("900 generations");
    expect(vitals).toContain(PAGE5.manifest.run_id);
  });

  // The instruments are cited where the close names all three checkpoints: the
  // model card and the dataset resolve in a References sidenote, on Hugging Face.
  it("cites the model card and the dataset, linked to Hugging Face", () => {
    render(<Page5 />);
    const qwen = screen.getByRole("link", { name: /Qwen2\.5-3B-Instruct.*model card/i });
    expect(qwen).toHaveAttribute("href", "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct");
    const math500 = screen.getByRole("link", { name: /MATH-500 dataset card/i });
    expect(math500).toHaveAttribute(
      "href",
      "https://huggingface.co/datasets/HuggingFaceH4/MATH-500",
    );

    // Both markers sit in the close's opening paragraph, numbered after step 1's.
    const close = screen.getByText(/Figures 1 and 2 are one checkpoint/).closest("p")!;
    expect(Array.from(close.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
      "reference 3",
      "reference 4",
    ]);
  });

  // The "Also measured" note (the instruction null, the exemplar rungs) went
  // back to the notebook on 2026-08-08: the page shows what the chain is worth,
  // not how a model that already reasons responds to prompt engineering. Both
  // findings stay measured, in the download.
  it("does not carry the instruction and exemplar findings on the page", () => {
    render(<Page5 />);
    expect(body()).not.toContain("Also measured");
    expect(body()).not.toContain("A bound, not a zero");
    expect(body()).not.toContain("Worked examples in the prompt");
  });

  // The conditions are named plainly on every surface: buttons, cluster
  // labels, aria titles, prose. The euphemisms may not come back.
  it("says reasoning and non-reasoning, never the old euphemisms", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/forbidden to reason/i);
    expect(body()).not.toMatch(/left alone/i);
    expect(body()).not.toMatch(/allowed to reason/i);
  });

  // The provenance plate ("one measurement of ours, not a redrawing...") was
  // removed 2026-08-08 as jargon; the techniques stay cited, once each.
  it("cites the techniques once, with no provenance plate above the steps", () => {
    render(<Page5 />);
    expect(screen.getByRole("link", { name: /Wei et al. 2022/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kojima et al. 2022/ })).toBeInTheDocument();
    expect(body()).not.toContain("one measurement of ours");
    expect(body()).not.toContain("replay mode");
  });

  // The three-paragraph footer these came from was doing the notebook's job.
  // What survives sits in the margin beside the figure it qualifies, and only
  // what a reader cannot work out from that figure: method went back to the
  // download, including the grading provenance, which is true and not needed
  // while looking at 100 squares. Trimmed again on 2026-08-10 to the one line
  // a reader of this figure cannot supply: the truncation rate and the suffix
  // caveat are the notebook's, not the margin's.
  it("carries the limits in the margin rather than in a footer", () => {
    render(<Page5 />);
    const limits = screen.getByText(/Three checkpoints are not a scaling law/).closest("aside")!;
    // Kicker plus one line, and nothing else.
    expect(limits.textContent).toBe(
      "LimitsThree checkpoints are not a scaling law, and nothing here is plotted against size.",
    );
    expect(limits.textContent).not.toMatch(/\bbare\b|forced_blurt/);
    expect(body()).not.toContain("hit the token cap");
    expect(body()).not.toContain("is one phrasing and another would move the floor");
    expect(body()).not.toContain("never whether the working was sound");
    expect(body()).not.toContain("reasoning-from-scratch");
  });

  it("hands page 6 the working rather than a size claim", () => {
    render(<Page5 />);
    expect(body()).toContain("You have probably done this before");
    expect(body()).toContain("cut it off mid-sentence");
  });

  // Deck-wide copy rule: no em dashes in rendered text.
  it("has no em dash anywhere in its copy", () => {
    render(<Page5 />);
    expect(body()).not.toContain("—");
  });
});

// The animated path: reduced motion OFF, fake timers; Play streams the trace
// one step at a time and lands exactly once.
describe("Page 5 animated chain (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  it("Play streams the trace step by step to the landing", () => {
    render(<Page5 />);
    fireEvent.click(screen.getByRole("button", { name: /▶ play/i }));
    expect(screen.queryByText(tidyMath(BARE.steps[0].text))).toBeNull();
    act(() => {
      vi.advanceTimersByTime(720);
    });
    expect(screen.getByText(tidyMath(BARE.steps[0].text))).toBeInTheDocument();
    expect(body()).not.toContain(`it answered ${BARE.extractedAnswer}`);
    for (let i = 1; i < BARE.steps.length; i++) {
      act(() => {
        vi.advanceTimersByTime(720);
      });
    }
    expect(body()).toContain(`it answered ${BARE.extractedAnswer}`);
  });
});
