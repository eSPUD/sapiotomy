import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { BASE, BUDGETS, CHECKPOINTS, DISTILL, FINAL, RUN, pct } from "@/lib/page13";
import { Page13 } from "./Page13";

const follows = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const setStep = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /RL training step/i }), {
    target: { value: String(value) },
  });

describe("Page 13 (learned reasoning: one law, two knobs)", () => {
  it("opens on the lede: STaR as RL's simplest form, then GRPO going further, one bold term, no results", () => {
    render(<Page13 />);
    // STaR is already RL (expert iteration, as page 12 says), so GRPO is the step up (author, 2026-11-04).
    const lede = screen.getByText(/STaR is reinforcement learning in its simplest form/).closest("p")!;
    expect(lede.textContent).toMatch(/the reward is 1 or 0, and only the\s+1s are trained on/);
    expect(lede.textContent).toMatch(/keeps that reward but goes\s+further: it learns from every chain, right or wrong/);
    expect(lede.textContent).toMatch(/to think longer on its own\./);
    // Both STaR and RL grade only the answer: "process" is page 9's word for
    // step grading, which R1-Zero's reward never does.
    expect(lede.textContent).not.toMatch(/process/);
    expect(lede.querySelectorAll("strong")).toHaveLength(1);
    expect(lede.querySelector("strong")!.textContent).toBe("GRPO");
    expect(lede.textContent).not.toMatch(/\d+(\.\d+)?%/);
    // The seam must rhyme with page 12's closing block, not restate it.
    expect(lede.textContent).not.toMatch(/two ways to buy reasoning/);
    expect(lede.textContent).not.toMatch(/the question lands/);
    expect(lede.textContent).not.toMatch(/long before/);
  });

  it("cut the I/II framing, the open questions, and the dates used as plot", () => {
    render(<Page13 />);
    expect(screen.queryByText(/Frontier Reasoners/)).not.toBeInTheDocument();
    expect(screen.queryByText(/The questions o1 cannot answer/)).not.toBeInTheDocument();
    expect(screen.queryByText("What are you actually buying when you turn the thinking dial?")).not.toBeInTheDocument();
    expect(screen.queryByText(/Four months later/)).not.toBeInTheDocument();
    expect(screen.queryByText(/an open lab answered/)).not.toBeInTheDocument();
    expect(screen.queryByText(/the week before/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Turn the page\./)).not.toBeInTheDocument();
    // One coda, not two.
    expect(screen.getAllByLabelText("Where this leaves us")).toHaveLength(1);
  });

  it("is not a history: no margin timeline", () => {
    render(<Page13 />);
    expect(screen.queryByText("Timeline")).not.toBeInTheDocument();
    for (const when of ["Sept 2024", "Dec 2024", "Jan 2025"]) {
      expect(screen.queryByText(when)).not.toBeInTheDocument();
    }
    expect(screen.queryByText(/OpenAI announces/)).not.toBeInTheDocument();
  });

  it("orders the page by concept: loop, law, thinking, stacking, portability", () => {
    render(<Page13 />);
    const escape = (s: string) => s.replace(/[.?]/g, "\\$&");
    const headings = [
      "1. What can a wrong chain teach?",
      "2. Better answers, longer chains",
      "3. At scale, the chains keep growing",
      "4. Training stacks with inference-time scaling",
      "5. Whose chains did the student read?",
    ].map((h) => screen.getByRole("heading", { level: 2, name: new RegExp(`^${escape(h)}`) }));
    for (let i = 1; i < headings.length; i++) {
      expect(follows(headings[i - 1], headings[i])).toBe(true);
    }
    const handoff = screen.getByLabelText("Where this leaves us");
    expect(follows(headings[4], handoff)).toBe(true);
    // Author, 2026-11-06: the loop-animation prototypes are gone from the bottom of the page.
    expect(screen.queryByText(/Five animations for the loop/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PROTOTYPES/i)).not.toBeInTheDocument();
  });

  describe("section 1: what can a wrong chain teach?", () => {
    it("states the loop against STaR by name, never by page number", () => {
      render(<Page13 />);
      const section = screen.getByRole("heading", { level: 2, name: /^1\. What can a wrong chain teach\?/ }).closest("section")!;
      // The loop is GRPO's, named and spelled out; STaR is already RL, so the
      // section no longer says RL is "very similar to STaR" (author, 2026-11-04).
      expect(section.textContent).toMatch(/The loop illustrated below is GRPO.s \(Group Relative Policy Optimization\), the\s+recipe DeepSeek used to train R1-Zero\./);
      // Named once, in the opening: the closing paragraph doesn't restate it (author, 2026-11-05).
      expect(section.textContent).not.toMatch(/The seven lines above are/);
      expect(section.textContent).not.toMatch(/very similar to STaR/);
      expect(section.textContent).not.toMatch(/same three steps/);
      // The opening is GRPO on its own terms: no STaR in it (author, 2026-11-06).
      const opening = screen.getByText(/The loop illustrated below is GRPO/).closest("p")!;
      expect(opening.textContent).not.toMatch(/STaR/);
      expect(opening.textContent).toMatch(/For\s+every problem, the model writes several chains, and a program scores each answer 1 or\s+0\./);
      expect(opening.textContent).toMatch(/penalized for chains that scored poorly and\s+rewarded for chains that scored well/);
      // The opening previews the figure, then the algorithm (author, 2026-11-05).
      expect(opening.textContent).toMatch(/Below, the loop is drawn first, so you can watch\s+every chain reach reinforce, and then written out as an algorithm\./);
      // The STaR comparison comes after the algorithm: a wrong chain is trained on, not dropped.
      // In the author's words (2026-11-06).
      const comparison = screen.getByText(/GRPO differs from STaR, and some other reinforcement-learning approaches/).closest("p")!;
      expect(follows(screen.getByRole("figure", { name: /^GRPO pseudocode/ }), comparison)).toBe(true);
      expect(comparison.textContent).toMatch(/in what\s+happens to a wrong chain\./);
      expect(comparison.textContent).toMatch(/STaR writes one chain per problem, and drops it when the\s+answer is wrong\./);
      expect(comparison.textContent).toMatch(/GRPO, however, writes several and trains on every one\./);
      expect(comparison.textContent).toMatch(/A wrong chain\s+still teaches the model what not to do, so it is kept\./);
      // It closes on where GRPO steers: at training time, against best-of-N at inference time.
      // The reward checks only the answer, so the copy says "reasoning that reaches the right answer".
      expect(comparison.textContent).toMatch(/steer\s+the model toward reasoning that reaches the right answer/);
      expect(comparison.textContent).toMatch(/The steering happens at training time, unlike inference-time approaches\s+such as best-of-N with a process reward model\.\s*$/);
      // Author, 2026-11-04: no "page N did this" back-references.
      expect(section.textContent).not.toMatch(/\bpage \d+/i);
      expect(section.textContent).not.toMatch(/\bAct \d/);
      // The loop graph (page 12's grammar) labels each station by what it does,
      // and says no chain is dropped (author, 2026-11-05).
      const loop = within(section).getByRole("img", { name: /^GRPO's loop/ });
      expect(loop.getAttribute("aria-label")).toMatch(/Nothing is dropped/);
      const generate = within(loop).getByText("generate ×G");
      expect(within(loop).getByText("each answer vs. the key: 1 or 0")).toBeInTheDocument();
      expect(within(loop).getByText(/every chain kept/)).toBeInTheDocument();
      expect(screen.queryByText(/page 12 took one greedy try/)).not.toBeInTheDocument();
      expect(follows(generate, comparison)).toBe(true);
      // Section 1 is only what GRPO is and how it differs: the self-consistency
      // and human-text points are parked for elsewhere (author, 2026-11-06).
      expect(section.textContent).not.toMatch(/Notice that line 4/);
      expect(section.textContent).not.toMatch(/Nobody writes that reasoning/);
    });

    it("explains the loop with no o1 in it, and prints no o1 algorithm", () => {
      render(<Page13 />);
      const section = screen.getByRole("heading", { level: 2, name: /^1\. / }).closest("section")!;
      expect(section.textContent).not.toMatch(/\bo1\b|OpenAI/);
      // The rumored o1 recipe was cut on review 2026-07-30 and stays cut.
      expect(screen.queryByText("loop: while the compute budget lasts")).not.toBeInTheDocument();
      expect(screen.queryByText("M ← reinforce(M, rewards)")).not.toBeInTheDocument();
      const codes = Array.from(document.querySelectorAll("code"));
      expect(codes.every((c) => section.contains(c))).toBe(true);
    });

    it("teaches GRPO as pseudocode, in plain notes", () => {
      render(<Page13 />);
      // Page 12's listing form and notation: numbered lines, STaR's M, x, y, r, ŷ.
      const listing = screen.getByRole("figure", { name: /^GRPO pseudocode/ });
      expect(within(listing).getAllByText(/^[1-7]$/)).toHaveLength(7);
      expect(listing.textContent).toMatch(/for \(x, y\) in problems:/);
      expect(listing.textContent).toMatch(/for i = 1…G/);
      expect(listing.textContent).toMatch(/mean\(s\)\) \/ std\(s\)/);
      expect(screen.getByText(/a group of G chains per problem; STaR writes one/)).toBeInTheDocument();
      expect(screen.getByText(/a wrong chain gets a negative weight instead of being dropped/)).toBeInTheDocument();
      expect(listing.textContent).toMatch(/M ← update\(M, r, A\)/);
      expect(listing.textContent).toMatch(/keeps it from drifting too far/);
      // GRPO is named in the opening as the figure's loop; the box says whose recipe it is.
      expect(screen.getByText(/the recipe DeepSeek used to train R1-Zero/)).toBeInTheDocument();
      expect(screen.queryByText(/One recipe for this/)).not.toBeInTheDocument();
      // The no-second-network caption under the listing was cut (author, 2026-11-06).
      expect(screen.queryByText(/second network/)).not.toBeInTheDocument();
      // Jargon the plain notes replaced.
      expect(screen.queryByText(/critic/)).not.toBeInTheDocument();
      expect(screen.queryByText(/PPO/)).not.toBeInTheDocument();
      expect(screen.queryByText(/KL/)).not.toBeInTheDocument();
      // Every chain trains, so GRPO learns from every one, not only the right ones.
      expect(screen.getByText(/GRPO, however, writes several and trains on every one/)).toBeInTheDocument();
      expect(screen.queryByText(/keeps what the right\s+ones did/)).not.toBeInTheDocument();
    });

    it("keeps the GRPO line and pseudocode, with no group-luck chart or dial", () => {
      render(<Page13 />);
      // The STaR comparison follows the listing (author, 2026-11-06).
      const grpoPara = screen.getByText(/GRPO differs from STaR/).closest("p")!;
      // An "Algorithm" divider sits between the loop graph and the listing, as on page 12.
      const divider = screen.getByRole("heading", { level: 3, name: "Algorithm" });
      expect(follows(screen.getByRole("img", { name: /^GRPO's loop/ }), divider)).toBe(true);
      expect(follows(divider, screen.getByRole("figure", { name: /^GRPO pseudocode/ }))).toBe(true);
      expect(follows(screen.getByRole("figure", { name: /^GRPO pseudocode/ }), grpoPara)).toBe(true);
      expect(screen.getByRole("figure", { name: /^GRPO pseudocode/ })).toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /Line 2 of the recipe, drawn/ })).not.toBeInTheDocument();
      expect(screen.queryByText(/350 × 638/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Drag the dial/)).not.toBeInTheDocument();
    });
  });

  describe("section 2: better answers, longer chains", () => {
    const setTrain = (i: number) =>
      fireEvent.change(screen.getByRole("slider", { name: /RL training \(steps/ }), { target: { value: String(i) } });
    const setBudget = (i: number) =>
      fireEvent.change(screen.getByRole("slider", { name: /Thinking budget/ }), { target: { value: String(i) } });

    it("pins the page data to the author's run", () => {
      expect(RUN.model).toBe("Qwen/Qwen2.5-1.5B-Instruct");
      expect(RUN.full_finetune).toBe(true);
      expect(RUN.rl_steps).toBe(400);
      expect([RUN.n_eval, RUN.k]).toEqual([600, 32]);
      expect(CHECKPOINTS.map((c) => c.step)).toEqual([0, 25, 50, 100, 200, 400]);
      expect(BUDGETS).toEqual([64, 128, 256, 512, 1024]);
      expect([pct(BASE.pass1), pct(FINAL.pass1)]).toEqual([64.9, 73.8]);
      expect([Math.round(BASE.mean_len), Math.round(FINAL.mean_len)]).toEqual([191, 225]);
    });

    it("opens on the run in prose, ~9 points and ~18% more tokens, and hands the length to section 3", () => {
      render(<Page13 />);
      const section = screen.getByRole("heading", { level: 2, name: /^2\. / }).closest("section")!;
      // Author, 2026-11-06: the shaded before/after strip is gone; the graph carries the visuals.
      expect(screen.queryByRole("img", { name: /before and after 400 steps of GRPO/ })).not.toBeInTheDocument();
      expect(section.textContent).not.toMatch(/64\.9% → 73\.8%|191 → 225/);
      const intro = screen.getByText(/To show how GRPO improves a model/).closest("p")!;
      const text = intro.textContent!.replace(/\s+/g, " ");
      expect(text).toMatch(/we ran 400 steps of it on Qwen2\.5-1\.5B-Instruct/);
      expect(text).toMatch(/already been fine-tuned to follow instructions/);
      expect(text).toMatch(/raised its accuracy by about 9 points/);
      expect(text).toMatch(/about 18% more tokens per answer, though nothing in the reward asks for length\.$/);
      // Author, 2026-11-06: no pointer to section 3 here.
      expect(section.textContent).not.toMatch(/Section 3 follows/);
      // R1-Zero's endpoints and the o1 surface are gone from this section.
      expect(section.textContent).not.toMatch(/R1-Zero|AIME|\bo1\b|OpenAI|GPT-4o/);
      expect(screen.queryByRole("img", { name: /Three RL training runs/ })).not.toBeInTheDocument();
      expect(screen.queryByText(/the missing RL/)).not.toBeInTheDocument();
    });

    it("goes from the opening straight to the chart, with no run ledger on top of the card", () => {
      render(<Page13 />);
      // Author, 2026-11-06: the scaling-law restatement before the chart is gone;
      // the dial labels say what each knob does.
      expect(screen.queryByText(/model size picks your curve/)).not.toBeInTheDocument();
      expect(screen.queryByText(/RL training picks your curve now/)).not.toBeInTheDocument();
      // The model / training / test / dials ledger was removed (author, 2026-11-06).
      const section = screen.getByRole("heading", { level: 2, name: /^2\. / }).closest("section")!;
      expect(section.querySelector("dl")).toBeNull();
    });

    it("reads every dial position off the run: training lifts the ceiling", () => {
      render(<Page13 />);
      const chart = screen.getByRole("img", { name: /accuracy of one chain against its thinking budget/ });
      // Opens on the finished run with room to think.
      expect(chart.getAttribute("aria-label")).toMatch(/Your marker: after 400 steps, 1024 tokens, 74\.2 percent, \+9\.7 points/);
      setTrain(0);
      expect(chart.getAttribute("aria-label")).toMatch(/Your marker: before training, 1024 tokens, 64\.5 percent\.$/);
    });

    it("shows training costing points under a tight budget, and never claims o1's tidy trade", () => {
      render(<Page13 />);
      setBudget(1);
      const chart = screen.getByRole("img", { name: /accuracy of one chain against its thinking budget/ });
      expect(chart.getAttribute("aria-label")).toMatch(/after 400 steps, 128 tokens, 13\.8 percent, −14\.2 points/);
      expect(screen.getByText("what training did at this budget")).toBeInTheDocument();
      expect(screen.getByText(/But the trained model needs that\s+room\./)).toBeInTheDocument();
      // The closing paragraph quotes the chart's own cells, so the dials can confirm each one.
      const closing = screen.getByText(/Training raises the ceiling\./).closest("p")!;
      const text = closing.textContent!.replace(/\s+/g, " ");
      expect(text).toMatch(/With room to finish \(1,024 tokens\), the trained model is right more often: 64\.5% before training, 71\.5% after 50 steps, 74\.2% after 400\. Most of the gain comes early\./);
      expect(text).toMatch(/the trained one scores 13\.8% against the untrained model's 28\.0%, because its longer answers are less likely to finish in time\./);
      expect(text).toMatch(/Past 512 tokens, neither curve moves; on these problems, the chain is already done\.$/);
      expect(screen.getByText(/at that budget, training costs\s+points/)).toBeInTheDocument();
      expect(screen.queryByText(/trade one for one/)).not.toBeInTheDocument();
      expect(screen.queryByText(/buys back exactly the decade/)).not.toBeInTheDocument();
    });
  });

  describe("section 3: where the thinking comes from", () => {
    it("pins the training run to DeepSeek-AI 2025", () => {
      const p = curves.deepseekTraining.fit!.params;
      expect(p.start).toBe(15.6);
      expect(p.passAt1).toBe(71.0);
      expect(p.cons64).toBe(86.7);
    });

    it("opens at step 0: 15.6% pass@1 and a strictly forward trace skeleton", () => {
      render(<Page13 />);
      expect(screen.getByText("15.6%")).toBeInTheDocument();
      expect(screen.getByText("≈1,000")).toBeInTheDocument();
      const skeleton = screen.getByRole("img", { name: /trace skeleton, early in training/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/three steps forward/i);
      expect(skeleton.getAttribute("aria-label")).not.toMatch(/loops back/i);
      expect(screen.queryByText(/doubts what it has just written/)).not.toBeInTheDocument();
    });

    it("scrubbing to the end reaches 71.0% / ≈9,000 tokens and the skeleton grows its loop", () => {
      render(<Page13 />);
      setStep(8000);
      expect(screen.getAllByText("71.0%").length).toBeGreaterThan(0);
      expect(screen.getByText("≈9,000")).toBeInTheDocument();
      const skeleton = screen.getByRole("img", { name: /trace skeleton after the aha/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/loops back to its own first line/i);
      expect(skeleton.getAttribute("aria-label")).toMatch(/second pass/i);
    });

    it("keeps the mid stage strictly forward: longer skeleton, still no loop", () => {
      render(<Page13 />);
      setStep(3000);
      const skeleton = screen.getByRole("img", { name: /trace skeleton, mid training/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/six steps forward/i);
      expect(skeleton.getAttribute("aria-label")).not.toMatch(/loops back/i);
    });

    it("shows the aha in one fixed paragraph that never changes with the dial", () => {
      render(<Page13 />);
      const flat = (el: Element) => el.textContent!.replace(/\s+/g, " ").trim();
      // Author's wording, 2026-11-06 (spelling and punctuation copy-edited), with Liu et al.
      // cited for the base-model claim.
      const aha = screen.getByText(/As you can see above, there is a very interesting side effect of RL here\./).closest("p")!;
      const before = flat(aha);
      expect(before).toBe(
        "As you can see above, there is a very interesting side effect of RL here. R1-Zero's chains begin to interrupt themselves. In the trace DeepSeek shows, the model stops mid-solution and second-guesses its reasoning. It then goes back to re-derive an earlier step. This was not the goal of RL, nor is it exclusive to RL: on rare occasions, it can actually happen in Qwen2.5 base models.reference 3 However, RL made it significantly more common.",
      );
      expect(within(aha).getByRole("link", { name: /reference 3/ })).toBeInTheDocument();
      // Author, 2026-11-06: the words below the figure no longer change with the slider.
      setStep(8000);
      expect(flat(aha)).toBe(before);
      expect(screen.queryByText(/Nothing looks back|still strictly forward|doubts what it has just written/)).not.toBeInTheDocument();
      // The verified finding (base models re-check before RL) rules out "learned to suspect itself".
      expect(screen.queryByText(/learned to suspect itself/)).not.toBeInTheDocument();
      // It follows the figure directly.
      const chart = screen.getByRole("img", { name: /^R1-Zero across RL training/ });
      expect(follows(chart, aha)).toBe(true);
      expect(aha.previousElementSibling).toBe(chart.closest("figure"));
      const skeleton = screen.getByRole("img", { name: /trace skeleton after the aha/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/the step the trace doubts/i);
      expect(
        screen.queryByText(/found (a |an )?(mistake|error)|wrong step|catches (a|its) (mistake|error)/i),
      ).not.toBeInTheDocument();
    });

    it("plots both variables as two stacked panels on one step axis", () => {
      render(<Page13 />);
      const chart = screen.getByRole("img", { name: /^R1-Zero across RL training, two stacked panels sharing the training step axis/ });
      const label = chart.getAttribute("aria-label")!;
      expect(label).toMatch(/15\.6 percent .* 71\.0 percent/);
      expect(label).toMatch(/1,000 to about 9,000 tokens/);
      expect(label).toMatch(/no term in the reward mentions length/);
      expect(label).toMatch(/labelled as test-time compute/);
      expect(label).not.toMatch(/page \d+/i);
      expect(label).toMatch(/aha trace appears \(illustrative placement\)/);
      expect(screen.queryByRole("img", { name: /two y axes/i })).not.toBeInTheDocument();
    });

    it("opens on the claim, bridges from section 2 to R1-Zero, then reads it outside the card", () => {
      render(<Page13 />);
      const section = screen.getByRole("heading", { level: 2, name: /^3\. / }).closest("section")!;
      // Author's wording, 2026-11-06: three paragraphs, word for word.
      const flat = (el: Element) => el.textContent!.replace(/\s+/g, " ").trim();
      const opening = screen.getByText(/The GRPO reward function only steers the model/).closest("p")!;
      expect(flat(opening)).toBe(
        "The GRPO reward function only steers the model based on whether the reasoning produced a correct answer. It does not reward longer responses or tell the model to double-check its work.",
      );
      expect(within(opening).getByText("does not").tagName).toBe("STRONG");
      const chart = screen.getByRole("img", { name: /^R1-Zero across RL training/ });
      const meaning = screen.getByText(/As you can see above, there is a very interesting side effect/).closest("p")!;
      // No small-scale panel (section 2 already shows our model writing longer answers).
      expect(screen.queryByRole("heading", { level: 3, name: /At small scale|At frontier scale/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /^Qwen2\.5-1\.5B-Instruct across 400 steps of GRPO/ })).not.toBeInTheDocument();
      const intro = screen.getByText(/We.ve already seen how a small model/).closest("p")!;
      expect(follows(opening, intro)).toBe(true);
      expect(flat(intro)).toMatch(
        /^We've already seen how a small model \(Qwen2\.5-1\.5B-Instruct\) reacted to this setup: as accuracy climbed, it naturally started using more tokens to work through problems\. To see what happens when you scale this up, we can look at DeepSeek's R1-Zero, which used the exact same training method on a much larger base model \(the start and end of each curve come from DeepSeek's paper; the climb between them is drawn\)\./,
      );
      const instruct = screen.getByText(/Move the slider forward in 500-step increments/).closest("p")!;
      expect(follows(intro, instruct)).toBe(true);
      expect(flat(instruct)).toBe(
        "Move the slider forward in 500-step increments and keep an eye on how both accuracy and response length change over time.",
      );
      expect(follows(instruct, chart)).toBe(true);
      expect(follows(chart, meaning)).toBe(true);
      // Figure cards hold only the figure (author, 2026-11-06): the prose sits outside.
      const card = chart.closest("figure")!;
      expect(card.contains(meaning)).toBe(false);
      // Author, 2026-11-06: the aha paragraph ends the section; "Either way…" moved to section 4.
      expect(section.lastElementChild).toBe(meaning);
      expect(screen.queryByText(/Either way, what training buys/)).not.toBeInTheDocument();
      // Removed 2026-11-06: the API aside (o1 is off the page) and the narration argument,
      // which the base-model findings below now contest.
      expect(section.textContent).not.toMatch(/behind an API|The tokens do the work|Re-derivation is not narration/);
      // Guard: no quiz-key block restating questions with answers.
      expect(screen.queryByText(/^\s*(What|Whether) the (thinking|model|law)/)).not.toBeInTheDocument();
    });

    it("cites the base-model finding, without the jargon paragraphs", () => {
      render(<Page13 />);
      expect(screen.getByRole("link", { name: /Understanding R1-Zero-Like Training/ })).toHaveAttribute(
        "href",
        "https://arxiv.org/abs/2503.20783",
      );
      // Author, 2026-11-06: "jargon". The length-schedule line, "Learned, or brought out?"
      // and with it the DAPO reference are gone.
      expect(screen.queryByText(/Length is not a schedule anyone set/)).not.toBeInTheDocument();
      expect(screen.queryByText("Learned, or brought out?")).not.toBeInTheDocument();
      expect(screen.queryByText(/DAPO/)).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /DAPO: An Open-Source LLM/ })).not.toBeInTheDocument();
    });

    it("carries no disclosure paragraph under R1-Zero's figure", () => {
      render(<Page13 />);
      // Author, 2026-11-06: the "start and end of each R1-Zero curve" block is gone from the page.
      expect(screen.queryByText(/The start and end of each R1-Zero curve/)).not.toBeInTheDocument();
      expect(screen.queryByText(/schematic of the structure/)).not.toBeInTheDocument();
      expect(screen.queryByText(/OpenAI published two separate charts/)).not.toBeInTheDocument();
      expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
      expect(screen.queryByText("Cited")).not.toBeInTheDocument();
    });
  });

  describe("section 4: stack the toolbox on top", () => {
    it("opens on the author's question, outside the card, before the readings", () => {
      render(<Page13 />);
      const heading = screen.getByRole("heading", { level: 2, name: /^4\. / });
      const opening = heading.nextElementSibling!;
      expect(opening.tagName).toBe("P");
      // Author's wording, 2026-11-06, copy-edited for grammar.
      expect(opening.textContent!.replace(/\s+/g, " ").trim()).toBe(
        "It is now clear that RL methods such as GRPO and STaR result in longer chains and better accuracy. You may wonder whether we still need inference-time scaling methods at all, or whether we should simply train more. To answer that question, here is a quick overview of how inference-time scaling methods can actually be stacked with reasoning-focused RL.",
      );
      const figure = screen.getByRole("img", { name: /readings of one run, every bar drawn from a common zero/ });
      expect(follows(opening, figure)).toBe(true);
      // The card holds only the bars: no "Act 2" lead-in inside it.
      const card = figure.closest("figure")!;
      expect(card.contains(opening)).toBe(false);
      expect(card.textContent).not.toMatch(/Act 2|second storey/);
    });

    it("reads our run five ways from a common zero, never a waterfall", () => {
      render(<Page13 />);
      const figure = screen.getByRole("img", { name: /readings of one run, every bar drawn from a common zero/ });
      // Author, 2026-11-06: one chain and a majority vote, each before and after training,
      // then any of 32 right.
      const labels = [
        "before training",
        "after training",
        "majority vote, before training",
        "majority vote, after training",
        "any of 32 right",
      ];
      for (const label of labels) expect(within(figure).getByText(label)).toBeInTheDocument();
      const bars = Array.from(figure.querySelectorAll<HTMLElement>("div.absolute"));
      for (const bar of bars) {
        expect(bar.className).toContain("left-0");
        expect(bar.style.left).toBe("");
      }
      expect(bars.map((b) => b.style.width)).toEqual(["64.9%", "73.8%", "81.7%", "84.7%", "97.7%"]);
      // Grey for the untrained model, the compute hue for the trained one.
      expect(bars.map((b) => b.className.match(/bg-(grid|compute|correct)/)![1])).toEqual([
        "grid",
        "compute",
        "grid",
        "compute",
        "correct",
      ]);
    });

    it("drops the caption and the trade callout under the bars", () => {
      render(<Page13 />);
      // Author, 2026-11-06: removed.
      expect(screen.queryByText(/Every bar starts at zero, because the readings are alternatives/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Training is paid once; the vote is paid every time/)).not.toBeInTheDocument();
      // The o1 bars and the o1-ioi / o3 callout are gone.
      expect(screen.queryByText(/\bo3\b/)).not.toBeInTheDocument();
      expect(screen.queryByText(/o1-ioi/)).not.toBeInTheDocument();
      expect(screen.queryByText("learned re-ranker")).not.toBeInTheDocument();
    });
  });

  describe("section 5: our distillation", () => {
    it("pins the run's numbers to the notebook's results table", () => {
      expect(DISTILL.n_eval).toBe(300);
      expect(DISTILL.arms.none).toMatchObject({ pass1: 0.283, mean_len: 191, rows: 0 });
      expect(DISTILL.arms.base15).toMatchObject({ pass1: 0.423, mean_len: 184, rows: 896 });
      expect(DISTILL.arms.grpo15).toMatchObject({ pass1: 0.493, mean_len: 238, rows: 1891 });
      expect(DISTILL.teacher_before.pass1).toBe(0.65);
      expect(DISTILL.teacher_after.pass1).toBe(0.72);
    });

    it("replaces 'Data the model writes itself' and R1's dot plot", () => {
      render(<Page13 />);
      expect(screen.queryByRole("heading", { name: /Data the model writes itself/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("img", { name: /horizontal dot plot/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/R1-Distill/)).not.toBeInTheDocument();
      expect(screen.queryByText(/placeholder/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/What it does add is text/)).not.toBeInTheDocument();
    });

    it("draws three students, measured, with the teacher as rules", () => {
      render(<Page13 />);
      for (const [name, value] of [
        [/^nothing/, "28.3%"],
        [/^1\.5B, before RL/, "42.3%"],
        [/^1\.5B, after RL/, "49.3%"],
      ] as const) {
        expect(within(screen.getByRole("button", { name })).getByText(value)).toBeInTheDocument();
      }
      expect(screen.queryByRole("button", { name: /^its own chains/ })).not.toBeInTheDocument();
      expect(screen.getByText("1.5B before RL · 65.0%")).toBeInTheDocument();
      expect(screen.getByText("after · 72.0%")).toBeInTheDocument();
    });

    it("defaults to the after-RL chains and switches the readout with the dial", () => {
      render(<Page13 />);
      expect(screen.getByRole("button", { name: /^1\.5B, after RL/ })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(/238 tokens per answer/)).toBeInTheDocument();
      expect(screen.getByText(/points over\s+the student that read the 1\.5B before RL/).textContent).toMatch(/^\+7\.0/);
      fireEvent.click(screen.getByRole("button", { name: /^1\.5B, before RL/ }));
      expect(screen.getByText(/points over\s+the 0\.5B as released/).textContent).toMatch(/^\+14\.0/);
      fireEvent.click(screen.getByRole("button", { name: /^nothing/ }));
      expect(screen.getByText(/This student read nothing/)).toBeInTheDocument();
    });

    it("discloses the unequal rows, and prints no transfer ratio", () => {
      render(<Page13 />);
      expect(screen.getByText(/896 training rows from the 1\.5B before\s+RL, 1,891 from the 1\.5B after it/)).toBeInTheDocument();
      expect(screen.queryByText(/the student kept/)).not.toBeInTheDocument();
    });

    it("keeps old page 14's coda, aimed at the wrong side of the dial", () => {
      render(<Page13 />);
      const coda = screen.getByLabelText("Where this leaves us");
      expect(coda.textContent).toMatch(/Every claim on this page arrived as a benchmark score/);
      expect(coda.textContent).toMatch(/49\.3% for a 0\.5B that read a trained model's chains/);
      expect(coda.textContent).not.toMatch(/o1-mini/);
      expect(coda.textContent).not.toMatch(/Two pages/);
      expect(coda.textContent).toMatch(/the side of that dial where thinking longer makes the answer worse/);
    });
  });

  it("links every reference, each once, numbered by first appearance", () => {
    render(<Page13 />);
    const hrefs = [
      "https://arxiv.org/abs/2501.12948",
      "https://arxiv.org/abs/2402.03300",
      "https://arxiv.org/abs/2503.20783",
    ];
    for (const href of hrefs) {
      expect(document.querySelectorAll(`a[href="${href}"]`)).toHaveLength(1);
    }
    // o1's announcement and the o3 ablation went with the constructed surface and the o1 bars.
    for (const gone of ["https://openai.com/index/learning-to-reason-with-llms/", "https://arxiv.org/abs/2502.06807"]) {
      expect(document.querySelectorAll(`a[href="${gone}"]`)).toHaveLength(0);
    }
    expect(screen.queryByText("preprint")).toBeNull();
  });

  it("offers the author's notebook beside the title", () => {
    render(<Page13 />);
    const link = screen.getByRole("link", { name: /Download the GRPO notebook \(ipynb, 0\.6 MB\)/ });
    expect(link).toHaveAttribute("href", "/notebooks/page_13_two_axis_grpo.ipynb");
  });

  it("tags the page Act 3", () => {
    render(<Page13 />);
    expect(screen.getByText(/Act 3 · Frontier & Caveats/)).toBeInTheDocument();
  });

  it("carries no em dash or en dash in rendered copy", () => {
    const { container } = render(<Page13 />);
    const offenders = Array.from(container.querySelectorAll("*"))
      .flatMap((el) => [el.textContent ?? "", el.getAttribute("aria-label") ?? ""])
      .filter((t) => t.includes("—") || t.includes("–"));
    expect(offenders).toEqual([]);
  });
});
