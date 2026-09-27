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

import { COST_ESTIMATE, Page5 } from "./Page5";
import { PAGE5, SUPPRESSION_TABLE, tidyMath } from "@/lib/page05";

const BLURT = PAGE5.figure1.tabs[0];
const BARE = PAGE5.figure1.tabs[1];

const body = () => document.body.textContent ?? "";
const nextBtn = () => screen.getByRole("button", { name: /next ▸/i });
// Both conditions are named "non-reasoning" wherever they appear, so figure 1's
// prompt tabs and figure 2's switch share a label; scope each to its own group.
const promptTabs = () => within(screen.getByRole("group", { name: "Prompt" }));
const conditionSwitch = () => within(screen.getByRole("group", { name: "Reasoning condition" }));
const bareTab = () => promptTabs().getByRole("button", { name: /the question alone/i });
const blurtTab = () => promptTabs().getByRole("button", { name: /non-reasoning/i });

/** Walk the whole trace via Next presses (reduced motion → no Play). */
function walk(steps: number) {
  for (let i = 0; i < steps; i++) fireEvent.click(nextBtn());
}

// Sections 1 and 2 merged on 2026-09-27 under the reviewer-response plan: the
// definition is the author's scratch-paper draft, and the specimen sits under it.
describe("Page 5, step 1: what a chain of thought is", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("defines the term with a worked example, in one merged step", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[0]).toBe("1. What a chain of thought is");
    expect(headings[1]).toBe("2. Scaling beyond one problem");
    expect(headings[2]).toBe("3. Size against reasoning");
    expect(headings[3]).toBe("4. The cost of a chain of thought");
    expect(headings).toHaveLength(4);
    expect(body()).toContain("require thinking beyond blurting the answer");
    expect(body().replace(/\u00a0/g, " ")).toContain(
      "For 17 × 24, you might work out 17 × 20 = 340, then 17 × 4 = 68, then add them to get 408",
    );
    expect(body()).toContain("that series of steps, written out");
    // Cut by the author 2026-09-27: a person's written steps are their thinking too.
    expect(body()).not.toContain("the thinking itself");
  });

  // The phrase is the one the cited paper published, because the marker sits on
  // it; the run's own instruction suffix is a different string and its arm is
  // not on the page.
  it("names the classic ask in the words the cited paper published", () => {
    render(<Page5 />);
    expect(body()).toContain("A common way to ask a model for one is to end the prompt with “Let's think step by step.”");
    expect(body()).toContain("Let's think step by step.");
    expect(body()).not.toContain(PAGE5.manifest.conditions.zero_shot_cot.trim());
  });

  // Pages 1 to 3's grammar: the marker sits on the claim, and the entry sits in
  // a right-hand References sidenote beside the step, with the number tying the
  // two together.
  it("marks the two techniques in the prose and resolves them in a References sidenote", () => {
    render(<Page5 />);
    expect(screen.queryByText(/cited for the technique/i)).not.toBeInTheDocument();

    // Markers on the definition, numbered in order of appearance (the third is
    // the model card, where the paragraph names the model).
    const step = screen.getByText(/A common way to ask a model for one/).closest("p")!;
    expect(Array.from(step.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
      "reference 1",
      "reference 2",
      "reference 3",
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
   * number from here to page 16 is counted in tokens and decoded greedily, so
   * both are defined here. The audience is first-year undergraduates with no ML
   * background. `checkpoint` used to be glossed here too; the author cut it on
   * 2026-09-27 as a term that would not make sense to this reader however it was
   * defined, so the page says "model" instead.
   */
  it("defines token and greedy, since every later number is denominated in them", () => {
    render(<Page5 />);
    const t = body();
    expect(t).toMatch(/A token is a word-piece, the unit a model writes one at a time/i);
    expect(t).toMatch(/takes its single most likely next token/i);
    expect(t).not.toMatch(/one saved set of a model's trained numbers/i);
  });

  // The glosses moved out of the reading column into a "Terms" note beside the
  // step on 2026-09-27 (reviewer plan). They must still reach the reader as
  // sentences, since the chip cannot hold one.
  it("glosses token and greedy in a Terms note beside the step", () => {
    render(<Page5 />);
    expect(body()).toContain("bf16");
    const gloss = screen.getByText(/single most likely next token/i);
    expect(gloss.closest("p")).not.toBeNull();
    const terms = screen.getByText("Terms").closest("aside")!;
    expect(terms).toContainElement(gloss);
    expect(terms).toHaveTextContent(/A token is a word-piece/);
    // And it says what greedy buys the reader: the trace below is not a lucky draw.
    expect(gloss.textContent).toMatch(/the same prompt always produces the same chain/i);
  });

  // The step's premise: the classic way is to ask, and this model does not need
  // asking. The figure is a look at what that produces.
  it("says the model writes a chain unasked before showing the trace", () => {
    render(<Page5 />);
    expect(body().replace(/\u00a0/g, " ")).toContain(
      "Today's models no longer need that phrase, because System 2 is their default",
    );
    expect(body().replace(/\u00a0/g, " ")).toContain(
      "into System 1, answering immediately, and compare the two",
    );
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

  it("switching to the non-reasoning prompt resets the walk and lands wrong", () => {
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
    expect(body()).toContain("Nothing is added after the question.");
    expect(body()).not.toContain(BLURT.promptAfter.trim());

    fireEvent.click(blurtTab());
    expect(body()).toContain(BLURT.promptAfter.trim());
    expect(body()).toContain("Highlighted: the only text added to the question.");
  });
});

describe("Page 5, figure 2: the cost of working with no reasoning", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // "43" is not a claim. "43 of the same 100" is, so the intro carries the denominator.
  // Since 2026-09-27 it also carries the System 1 score (reviewer plan, decision D6):
  // both sides of the comparison sit side by side, and the switch shows which problems go.
  it("gives both sides of the comparison, with the denominator", () => {
    render(<Page5 />);
    const intro = (screen.getByText(/Was that one problem a fluke/).textContent ?? "").replace(
      /\u00a0/g,
      " ",
    );
    expect(intro).toContain(`Here is the same model on ${PAGE5.figure2.bare.n} hard problems from the MATH-500 benchmark`);
    expect(intro).toContain(`In System 2 (reasoning) it solved ${PAGE5.figure2.bare.nCorrect}.`);
    expect(intro).toContain(`In System 1 (non-reasoning) it solved ${PAGE5.figure2.blurt.nCorrect}.`);
    expect(intro).toContain("Each square below is one problem.");
  });

  it("starts with the model reasoning and flips to the floor", () => {
    render(<Page5 />);
    const fig2 = screen.getByLabelText("The cost of working with no reasoning");
    expect(body()).toContain(`solved, of the same ${PAGE5.figure2.bare.n} problems`);
    expect(within(fig2).getByText(String(PAGE5.figure2.bare.nCorrect))).toBeInTheDocument();
    expect(body()).toContain(`median ${PAGE5.figure2.bare.medianTokens} tokens written`);

    fireEvent.click(conditionSwitch().getByRole("button", { name: "non-reasoning" }));
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
    expect(body()).not.toContain("Working with no reasoning costs");
    fireEvent.click(conditionSwitch().getByRole("button", { name: "non-reasoning" }));
    expect(body()).toContain(
      `Working with no reasoning costs ${PAGE5.figure2.suppression.deltaPts} points`,
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
    fireEvent.click(conditionSwitch().getByRole("button", { name: "non-reasoning" }));
    expect(body()).toContain("Give only the final answer.");
  });

  // Cut by the author 2026-09-27: the figure needs no reading instructions.
  it("carries no how-to-read note beside the figure", () => {
    render(<Page5 />);
    expect(screen.queryByText("How to read it")).toBeNull();
    expect(body()).not.toContain("count the squares that change colour");
  });
});

describe("Page 5, figure 3: the floor is flat", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // The author's intro, 2026-09-27: why a third figure exists, in one sentence,
  // with the two sizes named as the bars label them. No reading instructions.
  it("says why a third figure exists, in one sentence", () => {
    render(<Page5 />);
    expect(body()).toContain(
      `To show that these results are not specific to one model, we ran the same ${PAGE5.figure2.bare.n}-problem experiment on a smaller (1.5B) and a larger (7B) model from the same family, and compared the results.`,
    );
    expect(body()).not.toContain("Watch where the left piece ends instead");
  });

  it("compares named checkpoints and never puts size on an axis", () => {
    render(<Page5 />);
    const t = body().replace(/\u00a0/g, " ");
    expect(t).toContain("Forced into System 1, the 7B solves 11%");
    expect(t).toContain("Left in System 2, the 1.5B solves 22%");
    // The emergence claim and the redrawn PaLM chart left the page with the
    // premise. Our trend is smooth and monotone; a sign flip is not in it.
    expect(body()).not.toMatch(/emergen/i);
    expect(body()).not.toMatch(/PaLM/i);
  });

  // The author rewrote the two paragraphs under figure 3 into one on 2026-09-27
  // and dropped the old hedge. What the sentence claims must still hold in the
  // data: the 1.5B is under a quarter of the 7B, and it scores at least double.
  it("states the cross-model result, and its words match the data", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "A model less than a quarter the size does twice as well, just by writing out its steps.",
    );
    const { cross } = PAGE5.figure3;
    expect(cross.param_ratio).toBeGreaterThan(4);
    expect(cross.ungagged_small_accuracy).toBeGreaterThanOrEqual(2 * cross.gagged_large_accuracy);
    expect(body()).not.toContain("the flat floor is the finding");
  });
});

// The close was three stat cards quoting one unnamed checkpoint, one of them a
// ×95.5 "trade". It is now a scatter: six cells, every one of them named.
describe("Page 5, figure 4: what each checkpoint wrote against what it solved", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // Reframed around tokens on 2026-09-27. The words are fixed; the data must
  // keep earning them: every model's System 2 median is roughly a hundred times
  // its System 1 median, and "around 570" / "5 or 6" are read off the run.
  it("opens on the token cost, in words the run still supports", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings[3]).toBe("4. The cost of a chain of thought");
    expect(body().replace(/\u00a0/g, " ")).toContain(
      "A chain of thought is not free. In System 2, every model below writes about 100× as many tokens as in System 1, a median of around 570 per problem against 5 or 6.",
    );
    for (const m of PAGE5.figure3.models) {
      const ratio = m.bareMedianTokens / m.blurtMedianTokens;
      expect(ratio).toBeGreaterThan(80);
      expect(ratio).toBeLessThan(125);
    }
  });

  // The one estimated (not measured) claim on the page. "About a
  // hundred-thousandth" must stay within a factor of two of the maths, and the
  // margin note must say it is an estimate and cite where the inputs come from.
  it("compares a million chains with training, as a labelled estimate", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "Even across a million problems, the 3B's chains of thought add up to about a hundred-thousandth of what it cost to train the model.",
    );
    expect(COST_ESTIMATE.millionChainsShare).toBeGreaterThan(0.5e-5);
    expect(COST_ESTIMATE.millionChainsShare).toBeLessThan(2e-5);
    const note = screen.getByText("An estimate").closest("aside")!;
    expect(within(note).getByRole("link", { name: /Kaplan et al. 2020/ })).toBeInTheDocument();
    expect(within(note).getByRole("link", { name: /Qwen2.5 Technical Report/ })).toBeInTheDocument();
    expect(note.textContent).toContain("18 trillion tokens");
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
    const link = screen.getByRole("link", { name: /download the notebook/i });
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
    // The run id and its date are in the downloadable notebook, not on the page:
    // a 40-character hash is provenance no reader can check by eye, and pages 6
    // and 7 already keep theirs off the page.
    expect(body()).not.toContain(PAGE5.manifest.run_id);
  });

  // The instruments are cited where the page first names them (moved up from
  // section 4 on 2026-09-27): the model card in step 1, the dataset in step 2.
  it("cites the model card and the dataset, linked to Hugging Face", () => {
    render(<Page5 />);
    const qwen = screen.getByRole("link", { name: /Qwen2\.5-3B-Instruct.*model card/i });
    expect(qwen).toHaveAttribute("href", "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct");
    const math500 = screen.getByRole("link", { name: /MATH-500 dataset card/i });
    expect(math500).toHaveAttribute(
      "href",
      "https://huggingface.co/datasets/HuggingFaceH4/MATH-500",
    );

    // Numbered in order of first appearance: the model card closes step 1's
    // markers, the dataset opens step 2's.
    const step1 = screen.getByText(/A common way to ask a model for one/).closest("p")!;
    expect(Array.from(step1.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
      "reference 1",
      "reference 2",
      "reference 3",
    ]);
    const step2 = screen.getByText(/Was that one problem a fluke/).closest("p")!;
    expect(Array.from(step2.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
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

  // The three-paragraph footer these came from was doing the notebook's job, and
  // the one line that survived it (a "Limits" note beside figure 3) was cut by
  // the author on 2026-09-27. None of the old footer's caveats may come back.
  it("carries no limits note and none of the old footer's caveats", () => {
    render(<Page5 />);
    expect(screen.queryByText("Limits")).toBeNull();
    expect(body()).not.toContain("Three checkpoints are not a scaling law");
    expect(body()).not.toContain("hit the token cap");
    expect(body()).not.toContain("is one phrasing and another would move the floor");
    expect(body()).not.toContain("never whether the working was sound");
    expect(body()).not.toContain("reasoning-from-scratch");
  });

  // The close hands on a question, not a page number (reviewer plan, CP2).
  it("closes on the cost, and hands on a question rather than a page number", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "A chain of thought makes a model better at hard problems, and it charges for that in tokens.",
    );
    expect(body()).toContain(
      "How many tokens does it actually need, and what happens when you cut the chain off mid-sentence?",
    );
    expect(body()).not.toContain("Page 6 asks");
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
