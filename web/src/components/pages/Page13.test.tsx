import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { curves } from "@/lib/curves";
import { Page13 } from "./Page13";

const follows = (a: Element, b: Element) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

const setStep = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /RL training step/i }), {
    target: { value: String(value) },
  });

const setLuck = (value: number) =>
  fireEvent.change(screen.getByRole("slider", { name: /how many are also right/i }), {
    target: { value: String(value) },
  });

describe("Page 13 (learned reasoning: one law, two knobs)", () => {
  it("opens on the lede: STaR's filter, then RL going further, one bold term, no results", () => {
    render(<Page13 />);
    const lede = screen.getByText(/STaR bakes reasoning into the weights/).closest("p")!;
    expect(lede.textContent).toMatch(/it learns from\s+every chain, right or wrong/);
    expect(lede.textContent).toMatch(/to think\s+longer on its own\./);
    // Both STaR and RL grade only the answer: "process" is page 9's word for
    // step grading, which R1-Zero's reward never does.
    expect(lede.textContent).not.toMatch(/process/);
    expect(lede.querySelectorAll("strong")).toHaveLength(1);
    expect(lede.querySelector("strong")!.textContent).toBe("Reinforcement learning");
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
      "2. One law, two knobs",
      "3. Where the thinking comes from",
      "4. Stack the toolbox on top",
      "5. The curve is portable",
    ].map((h) => screen.getByRole("heading", { level: 2, name: new RegExp(`^${escape(h)}`) }));
    for (let i = 1; i < headings.length; i++) {
      expect(follows(headings[i - 1], headings[i])).toBe(true);
    }
    const handoff = screen.getByLabelText("Where this leaves us");
    expect(follows(headings[4], handoff)).toBe(true);
  });

  describe("section 1: what can a wrong chain teach?", () => {
    it("states the loop against STaR by name, never by page number", () => {
      render(<Page13 />);
      const section = screen.getByRole("heading", { level: 2, name: /^1\. What can a wrong chain teach\?/ }).closest("section")!;
      // "Similar", not "the same three steps": STaR filters and fine-tunes from
      // the base; RL scores a group and updates in place (author, 2026-11-04).
      expect(section.textContent).toMatch(/is very similar to STaR/);
      expect(section.textContent).not.toMatch(/same three steps/);
      // STaR samples one chain per problem; only RL writes a group, and that
      // group is what lets every chain be scored against the others.
      expect(section.textContent).toMatch(/STaR writes one chain per problem, while reinforcement\s+learning writes several and scores every one/);
      expect(section.textContent).toMatch(/penalized for chains that scored poorly and rewarded for chains that scored well/);
      // Author, 2026-11-04: no "page N did this" back-references.
      expect(section.textContent).not.toMatch(/\bpage \d+/i);
      expect(section.textContent).not.toMatch(/\bAct \d/);
      // The strip labels each station by what it does.
      const generate = screen.getByText("generate ×k");
      expect(screen.getByText("several chains for every problem")).toBeInTheDocument();
      expect(screen.getByText("the answer key scores each one, 1 or 0")).toBeInTheDocument();
      expect(screen.getByText(/toward the high scores, away from the low/)).toBeInTheDocument();
      expect(screen.queryByText(/page 12 took one greedy try/)).not.toBeInTheDocument();
      // Then the no-human / finite-data callout.
      const callout = screen.getByText(/Nobody writes the reasoning and nobody grades it by hand/);
      expect(follows(generate, callout)).toBe(true);
      expect(callout.textContent).toMatch(/limited stock of human-written text/);
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
      expect(screen.getByText(/sample G answers from the current policy/)).toBeInTheDocument();
      expect(screen.getByText(/mean\(r\)\) \/ std\(r\)/)).toBeInTheDocument();
      expect(screen.getByText(/each chain is measured against its group's average/)).toBeInTheDocument();
      expect(screen.getByText(/so it doesn't drift too far/)).toBeInTheDocument();
      expect(screen.getByText(/GRPO needs no\s+second network/)).toBeInTheDocument();
      // Jargon the plain notes replaced.
      expect(screen.queryByText(/critic/)).not.toBeInTheDocument();
      expect(screen.queryByText(/PPO/)).not.toBeInTheDocument();
      expect(screen.queryByText(/KL/)).not.toBeInTheDocument();
      expect(screen.getByText(/Line 2 is the same sampling self-consistency uses/)).toBeInTheDocument();
      expect(screen.getByText(/keeps what the right\s+ones did/)).toBeInTheDocument();
    });

    it("GRPO dial: the baseline chases the group and the same right answer's push shrinks", () => {
      render(<Page13 />);
      const group = screen.getByRole("img", { name: /Line 2 of the recipe, drawn/ });
      expect(group.getAttribute("aria-label")).toMatch(/350 times 638/);
      expect(screen.getByText(/group mean · 0\.50/)).toBeInTheDocument();
      expect(screen.getAllByText("+0.50")).toHaveLength(2);
      expect(screen.getByText(/push drops to \+0\.50/)).toBeInTheDocument();
      expect(screen.getByText("mis-added the partials")).toBeInTheDocument();
      expect(screen.getByText("dropped a zero")).toBeInTheDocument();

      setLuck(0);
      expect(screen.getByText("+0.75")).toBeInTheDocument();
      expect(screen.getByText(/the biggest push on offer/)).toBeInTheDocument();
      expect(screen.getByText(/That.s the chain no answer-time selector could find/)).toBeInTheDocument();
      expect(screen.getByText("read 638 as 628")).toBeInTheDocument();

      setLuck(2);
      expect(screen.getByText("−0.75")).toBeInTheDocument();
      expect(screen.getByText(/Rarity amplifies the signal in both directions/)).toBeInTheDocument();

      setLuck(3);
      expect(screen.getByText(/teaches it nothing/)).toBeInTheDocument();
      expect(screen.getByText(/group mean · 1\.00/)).toBeInTheDocument();
      expect(screen.queryByText(/[+−]0\.\d\d/)).not.toBeInTheDocument();
    });
  });

  describe("section 2: one law, two knobs", () => {
    it("leads with R1-Zero's reported endpoints, read as both knobs at once", () => {
      render(<Page13 />);
      const evidence = screen.getByRole("img", { name: /R1-Zero, from the start of RL training to the end/ });
      expect(evidence.textContent).toMatch(/15\.6% → 71\.0%/);
      expect(evidence.textContent).toMatch(/≈1,000 → ≈9,000/);
      // The run moved both dials, so the page may not sell it as pure RL.
      expect(screen.getByText(/This is both knobs moving at once/)).toBeInTheDocument();
      expect(screen.getByText(/Section 3 follows the length\./)).toBeInTheDocument();
      // And it comes before the constructed o1 surface.
      const toy = screen.getByRole("img", { name: /Three RL training runs/ });
      expect(follows(evidence, toy)).toBe(true);
    });

    it("frames the lab with page 11's idiom, curve-picker swapped for RL", () => {
      render(<Page13 />);
      expect(
        screen.getByText(/model size picks your curve; test-time compute slides you along it/),
      ).toBeInTheDocument();
      expect(screen.getByText(/RL training picks your curve now/)).toBeInTheDocument();
      expect(
        screen.getByText(/Thinking slides you along the curve; only training lifts it\./),
      ).toBeInTheDocument();
      expect(screen.getByText("Thinking time (compute in one answer)")).toBeInTheDocument();
      expect(screen.getByText("RL training (compute in one training run)")).toBeInTheDocument();
      expect(screen.getByText("the missing RL's share")).toBeInTheDocument();
    });

    it("says what the dials count and what the score is scored on", () => {
      render(<Page13 />);
      expect(
        screen.getByText(/×100 RL training is one run given a hundred times the training compute/),
      ).toBeInTheDocument();
      expect(screen.getByText(/not a hundred sampled answers/)).toBeInTheDocument();
      expect(screen.getByText(/section 4 stacks it on top/)).toBeInTheDocument();
      expect(screen.getByText(/pass@1 on AIME 2024/)).toBeInTheDocument();
      expect(screen.getByText("AIME 2024 pass@1 here")).toBeInTheDocument();
    });

    it("states the substitution the law actually has, not the opposite", () => {
      render(<Page13 />);
      // The exponents enter twoAxisAccuracy as a sum: law(2, 0) = law(0, 2) = 21.0.
      expect(screen.queryByText(/they do not\s+substitute/)).not.toBeInTheDocument();
      expect(
        screen.getByText(/×1 training with ×100 thinking scores the same 21\.0 as ×100 training/),
      ).toBeInTheDocument();
      expect(screen.getByText(/The thinking is bought again on every answer\./)).toBeInTheDocument();
      expect(
        screen.getByText(/all that thinking lands exactly where the full run/),
      ).toBeInTheDocument();
    });

    it("draws the whole run family at once, staircase stated, opening gap priced", () => {
      render(<Page13 />);
      const chart = screen.getByRole("img", {
        name: /Three RL training runs, each one run at a different training-compute budget, are drawn in full as parallel lines/,
      });
      expect(chart.getAttribute("aria-label")).toMatch(
        /times 10 more RL and times 10 more thinking buy the same 29\.5 points/,
      );
      expect(chart.getAttribute("aria-label")).toMatch(
        /times 10 run at times 10 thinking, scoring 21\.0 percent, with 29\.5 points forgone/,
      );
    });

    it("discloses every construction on the page in ONE block", () => {
      render(<Page13 />);
      const block = screen.getByText(/OpenAI published two separate charts, one per axis/);
      // The o1 surface.
      expect(block.textContent).toMatch(
        /Joining them into one surface, so that a decade of either dial buys the same points/,
      );
      expect(block.textContent).toMatch(/is this deck's construction and not a published result/);
      // The R1-Zero curve, skeleton and aha, in the same block.
      expect(block.textContent).toMatch(/the points between them are drawn along the reported climb/);
      expect(block.textContent).toMatch(/schematic of the structure in the paper's Table 3/);
      expect(block.textContent).toMatch(/illustrative\s+placement/);
      expect(block.textContent).toMatch(/The slope is the claim; the absolute compute is a secret\./);
      // No second block, no two-label footer.
      expect(screen.getAllByText(/illustrative placement|is an illustrative/)).toHaveLength(1);
      expect(screen.queryByText("Simulated")).not.toBeInTheDocument();
      expect(screen.queryByText("Cited")).not.toBeInTheDocument();
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
      expect(screen.getByText(/The extra tokens in the length panel are these loops/)).toBeInTheDocument();
    });

    it("keeps the mid stage strictly forward: longer skeleton, still no loop", () => {
      render(<Page13 />);
      setStep(3000);
      const skeleton = screen.getByRole("img", { name: /trace skeleton, mid training/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/six steps forward/i);
      expect(skeleton.getAttribute("aria-label")).not.toMatch(/loops back/i);
    });

    it("gives the interrupt a reason, and never calls it a located mistake", () => {
      render(<Page13 />);
      setStep(8000);
      expect(screen.getByText(/doubts what it has just written/)).toBeInTheDocument();
      expect(screen.getByText(/Nothing scored those steps/)).toBeInTheDocument();
      expect(screen.getByText(/Page 10's branch, score, backtrack/)).toBeInTheDocument();
      const skeleton = screen.getByRole("img", { name: /trace skeleton after the aha/i });
      expect(skeleton.getAttribute("aria-label")).toMatch(/the step the trace doubts/i);
      expect(
        screen.queryByText(/found (a |an )?(mistake|error)|wrong step|catches (a|its) (mistake|error)/i),
      ).not.toBeInTheDocument();
    });

    it("plots both variables as two stacked panels on one step axis", () => {
      render(<Page13 />);
      const chart = screen.getByRole("img", { name: /two stacked panels sharing the training step axis/ });
      const label = chart.getAttribute("aria-label")!;
      expect(label).toMatch(/15\.6 percent .* 71\.0 percent/);
      expect(label).toMatch(/1,000 to about 9,000 tokens/);
      expect(label).toMatch(/no term in the reward mentions length/);
      expect(label).toMatch(/page 11's test-time compute/);
      expect(label).toMatch(/aha trace appears \(illustrative placement\)/);
      expect(screen.queryByRole("img", { name: /two y axes/i })).not.toBeInTheDocument();
    });

    it("turns the old questions into claims shown, never a recap", () => {
      render(<Page13 />);
      expect(screen.getByText(/Nothing in the reward mentions length/)).toBeInTheDocument();
      const chart = screen.getByRole("img", { name: /two stacked panels/ });
      const meaning = screen.getByText(/Length is not a schedule anyone set/).closest("p")!;
      expect(follows(chart, meaning)).toBe(true);
      expect(screen.getByText("The thinking dial buys one longer chain.")).toBeInTheDocument();
      expect(screen.getByText(/not many chains sampled and voted on behind an API/)).toBeInTheDocument();
      expect(screen.getByText("The tokens do the work, not describe it.")).toBeInTheDocument();
      expect(screen.getByText(/the chain is what the model sampled and what training pushed on/)).toBeInTheDocument();
      expect(screen.getByText(/Re-derivation is not narration/)).toBeInTheDocument();
      // Guard: no quiz-key block restating questions with answers.
      expect(screen.queryByText(/^\s*(What|Whether) the (thinking|model|law)/)).not.toBeInTheDocument();
    });
  });

  describe("section 4: stack the toolbox on top", () => {
    it("draws every reading from a common zero, two models, never a waterfall", () => {
      render(<Page13 />);
      expect(screen.getByText("o1, one model read three ways")).toBeInTheDocument();
      expect(screen.getByText("R1-Zero, one model read two ways")).toBeInTheDocument();
      expect(screen.getByText("no learned chain")).toBeInTheDocument();
      expect(screen.getByText(/one instant answer from a strong LLM \(GPT-4o\)/)).toBeInTheDocument();
      expect(screen.getAllByText("majority vote")).toHaveLength(2);
      expect(screen.getByText("learned re-ranker")).toBeInTheDocument();
      expect(screen.queryByText("+8.9")).not.toBeInTheDocument();
      expect(screen.queryByText("+9.7")).not.toBeInTheDocument();
      const figure = screen.getByRole("img", { name: /every bar drawn from a common zero/ });
      const bars = Array.from(figure.querySelectorAll<HTMLElement>("div.absolute"));
      for (const bar of bars) {
        expect(bar.className).toContain("left-0");
        expect(bar.style.left).toBe("");
      }
      expect(bars.map((b) => b.style.width)).toEqual(["12%", "74.4%", "83.3%", "93%", "71%", "86.7%"]);
      expect(
        screen.getByText(/the vote and the re-ranker each replace the single chain/),
      ).toBeInTheDocument();
    });

    it("keeps the ablation as one short callout, the only place o3 appears", () => {
      render(<Page13 />);
      expect(screen.getByText("One recipe, no domain tricks.")).toBeInTheDocument();
      expect(screen.getByText(/beat the\s+hand-built specialist on its own contest/)).toBeInTheDocument();
      expect(screen.getByText(/Stacking pays once; the knobs compound\./)).toBeInTheDocument();
      const o3 = screen.getAllByText(/\bo3\b/);
      expect(o3.map((el) => el.tagName)).toEqual(["STRONG"]);
      expect(screen.queryByText(/96\.7/)).not.toBeInTheDocument();
      expect(screen.queryByText(/gold/)).not.toBeInTheDocument();
    });
  });

  describe("section 5: the curve is portable", () => {
    it("pins the distilled-model table to DeepSeek-AI 2025 Table 5", () => {
      expect(curves.deepseekDistill.points).toEqual([
        { x: 1.5, y: 28.9 },
        { x: 7, y: 55.5 },
        { x: 8, y: 50.4 },
        { x: 14, y: 69.7 },
        { x: 32, y: 72.6 },
        { x: 70, y: 70.0 },
      ]);
      const p = curves.deepseekDistill.fit!.params;
      expect(p.r1Aime).toBe(79.8);
      expect(p.o1miniAime).toBe(63.6);
      expect(p.gpt4oAime).toBe(9.3);
    });

    it("answers whether the law needs a frontier-scale model", () => {
      render(<Page13 />);
      expect(screen.getByText("Does the law need one?")).toBeInTheDocument();
      expect(screen.getByText(/lifting the curve took frontier-scale RL/)).toBeInTheDocument();
      expect(screen.getByText(/The curve-lifting knob got cheap/)).toBeInTheDocument();
      expect(screen.getByText(/someone still paid for\s+the RL once/)).toBeInTheDocument();
      expect(screen.getByText(/a lifted curve fits in weights you can download/)).toBeInTheDocument();
      expect(screen.getByText(/no RL and no reward, which is STaR's\s+recipe/)).toBeInTheDocument();
      expect(screen.getByText(/One good reasoner now writes the\s+curriculum for everyone else/)).toBeInTheDocument();
    });

    it("names whose GPT-4o score each figure uses", () => {
      render(<Page13 />);
      expect(
        screen.getByText(/9\.3% is DeepSeek's measurement, where sections 2 and 4 use\s+OpenAI's 12%/),
      ).toBeInTheDocument();
    });

    it("defaults the distill picker to Qwen-14B and updates on selection", () => {
      render(<Page13 />);
      expect(screen.getByRole("button", { name: /Qwen-14B/ })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByText(/R1-Distill-Qwen-14B/)).toBeInTheDocument();
      expect(screen.getByText(/clears o1-mini's line/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /Qwen-32B/ }));
      expect(screen.getByText(/R1-Distill-Qwen-32B/)).toBeInTheDocument();
      expect(screen.getByText(/within seven points of the 671B teacher/)).toBeInTheDocument();
    });

    it("draws the distillation trade as a dot plot: rows by size, closed models as rules", () => {
      render(<Page13 />);
      const label = screen.getByRole("img", { name: /horizontal dot plot/i }).getAttribute("aria-label")!;
      expect(label).toMatch(/Qwen-14B 69\.7 percent/);
      expect(label).toMatch(/Llama-70B 70 percent/);
      expect(label).toMatch(/671B mixture-of-experts, at 79\.8 percent/);
      expect(label).toMatch(/GPT-4o at 9\.3 percent and OpenAI o1-mini at 63\.6 percent/);
      expect(label).toMatch(/Llama-70B sits left of Qwen-32B/);
    });

    it("keeps old page 14's coda, aimed at the wrong side of the dial", () => {
      render(<Page13 />);
      const coda = screen.getByLabelText("Where this leaves us");
      expect(coda.textContent).toMatch(/Every claim on this page arrived as a benchmark score/);
      expect(coda.textContent).not.toMatch(/Two pages/);
      expect(coda.textContent).toMatch(/the side of that dial where thinking longer makes the answer worse/);
    });
  });

  it("links every reference, each once, numbered by first appearance", () => {
    render(<Page13 />);
    const hrefs = [
      "https://openai.com/index/learning-to-reason-with-llms/",
      "https://arxiv.org/abs/2501.12948",
      "https://arxiv.org/abs/2402.03300",
      "https://arxiv.org/abs/2502.06807",
    ];
    for (const href of hrefs) {
      expect(document.querySelectorAll(`a[href="${href}"]`)).toHaveLength(1);
    }
    expect(screen.queryByText("preprint")).toBeNull();
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
