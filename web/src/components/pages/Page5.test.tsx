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

describe("Page 5, figure 1: the chain is already there", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("lands on the bare prompt with nothing revealed yet", () => {
    render(<Page5 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("How to Reason");
    expect(bareTab()).toHaveAttribute("aria-pressed", "true");
    expect(blurtTab()).toHaveAttribute("aria-pressed", "false");
    expect(body()).toContain(`0 of ${BARE.tokensGenerated} tokens written`);
    expect(screen.queryByText(tidyMath(BARE.steps[0].text))).toBeNull();
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

  it("starts with the model left alone and flips to the floor", () => {
    render(<Page5 />);
    const fig2 = screen.getByLabelText("The cost of forbidding the working");
    expect(body()).toContain(`solved, of the same ${PAGE5.figure2.bare.n} problems`);
    expect(within(fig2).getByText(String(PAGE5.figure2.bare.nCorrect))).toBeInTheDocument();
    expect(body()).toContain(`median ${PAGE5.figure2.bare.medianTokens} tokens written`);

    fireEvent.click(screen.getByRole("button", { name: /forbidden to reason/i }));
    expect(within(fig2).getByText(String(PAGE5.figure2.blurt.nCorrect))).toBeInTheDocument();
    expect(body()).toContain(`median ${PAGE5.figure2.blurt.medianTokens} tokens written`);
    expect(body()).toContain(
      `${SUPPRESSION_TABLE.chainOnly} problems it had are gone. ${SUPPRESSION_TABLE.blurtOnly} it did not have arrive.`,
    );
  });

  // Paired, and printed as such: the discordant counts sit beside the contrast
  // so a reader never reads a paired result as two independent bars.
  it("prints the paired contrast with its discordant count and p-value", () => {
    render(<Page5 />);
    expect(body()).toContain(
      `Forbidding the working costs ${PAGE5.figure2.suppression.deltaPts} points`,
    );
    expect(body()).toContain("exact McNemar");
    expect(body()).toContain("p < 0.0001");
    expect(body()).toContain(
      `${SUPPRESSION_TABLE.chainOnly + SUPPRESSION_TABLE.blurtOnly} problems where the two conditions disagree`,
    );
  });

  it("shows the exact gag string, since one phrasing is all it is", () => {
    render(<Page5 />);
    fireEvent.click(screen.getByRole("button", { name: /forbidden to reason/i }));
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

  it("compares named checkpoints and never puts size on an axis", () => {
    render(<Page5 />);
    expect(body()).toContain("A 7B forbidden to reason solves 11%");
    expect(body()).toContain("A 1.5B allowed to reason solves 22%");
    expect(body()).toContain("Three checkpoints are not a scaling law");
    // The emergence claim and the redrawn PaLM chart left the page with the
    // premise. Our trend is smooth and monotone; a sign flip is not in it.
    expect(body()).not.toMatch(/emergen/i);
    expect(body()).not.toMatch(/PaLM/i);
  });
});

describe("Page 5: provenance and what the page may claim", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  // The pipeline's whole claim: a reader who doubts a figure re-derives it.
  it("links the notebook, the harness and the traces as one download", () => {
    render(<Page5 />);
    const link = screen.getByRole("link", { name: /download the notebook, the harness and all/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-05-how-to-reason.zip");
    expect(link).toHaveAttribute("download");
    expect(body()).toContain("redraws every figure here from those traces");
  });

  it("names the instrument on the page, not only in the footnote", () => {
    render(<Page5 />);
    expect(body()).toContain("Qwen2.5-Instruct · 1.5B, 3B, 7B");
    expect(body()).toContain("MATH-500 levels 4 and 5");
    expect(body()).toContain("900 generations");
    expect(body()).toContain(PAGE5.manifest.run_id);
  });

  // The instruction contrast is measured and not plotted, and it is stated as a
  // bound. "Nothing" unqualified is the one word the claims contract forbids.
  it("states the instruction null as a bound and hands it to page 12", () => {
    render(<Page5 />);
    expect(body()).toContain(
      `${PAGE5.figure2.instruction.fixed} problems fixed and ${PAGE5.figure2.instruction.broken} broken`,
    );
    expect(body()).toContain("which is a bound and not a zero");
    expect(body()).toContain("page 12 opens on it");
  });

  it("cites the techniques and says the numbers are ours", () => {
    render(<Page5 />);
    expect(body()).toContain("Techniques cited. The measurements on this page are ours:");
    expect(screen.getByRole("link", { name: /Wei et al. 2022/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Kojima et al. 2022/ })).toBeInTheDocument();
    expect(body()).toContain("Every number on this page is ours.");
  });

  it("carries the limits rather than burying them", () => {
    render(<Page5 />);
    expect(body()).toMatch(/traces hit the cap, which biases the headline conservative/);
    expect(body()).toContain("fallback to the last number");
    expect(body()).toContain("never whether the working was sound");
  });

  it("hands page 6 the token multiple rather than a size claim", () => {
    render(<Page5 />);
    expect(body()).toContain(`${PAGE5.close.blurt_median_tokens} tokens`);
    expect(body()).toContain(`${PAGE5.close.bare_median_tokens} tokens`);
    expect(body()).toContain(`×${PAGE5.close.token_multiple}`);
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
