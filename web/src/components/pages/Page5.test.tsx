import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Page5 } from "./Page5";
import { PAGE5, SHOTS, SHOT_KEYS, SHOT_LABEL, WORKED_SOLUTIONS, pct, tidyMath } from "@/lib/page05";

const body = () => (document.body.textContent ?? "").replace(/\s+/g, " ");
const N = PAGE5.n;
const [B15, B3, B7] = PAGE5.base;
/** The difference of the two printed percentages, as the page prints it. */
const pts = (a: number, b: number) => ((Math.round(a * 1000) - Math.round(b * 1000)) / 10).toFixed(1);

describe("Page 5, the Act 2 opener", () => {
  it("picks up page 4's question and maps the act, unchanged from the old page", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "Act 1 ended on a question: can a language model reason through a problem instead of answering on reflex? Act 2 answers it with a toolbox of ways to spend more computation on each answer: think longer in one chain (pages 5 and 6), try many paths and pick the best (pages 7 to 9), search through them (page 10), and finally weigh all of it against simply using a bigger model (page 11). The first tool is the simplest: have the model write out its steps.",
    );
  });

  it("notes the hardware in a sidenote beside the opener", () => {
    render(<Page5 />);
    const note = screen.getByText("Hardware").closest("aside")!;
    expect(note).toHaveTextContent("An A100 GPU with 80GB VRAM was used in these experiments.");
    expect(PAGE5.provenance.decoding.hardware).toContain("A100");
    expect(note.className).not.toMatch(/lg:pt-9/);
    expect(note.previousElementSibling?.textContent).toMatch(/^\s*Act 1 ended on a question/);
  });
});

describe("Page 5, step 1: what a chain of thought is", () => {
  it("has three steps, in Shashank's order", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings).toEqual([
      "1. Chain-of-Thought (CoT): Reasoning over simple steps",
      "2. ‘Zero-shot’ versus ‘few-shot CoT prompting’",
      "3. ‘Base model with few-shot CoT prompting’ versus ‘Instruct model’",
    ]);
    expect(screen.queryByLabelText("The floor is flat")).toBeNull();
  });

  it("keeps the author's definition and the classic ask in the cited paper's words", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "We've previously illustrated what step-by-step reasoning looks like for a couple of real-world problems. Chain-of-thought prompting simulates human reasoning by using each intermediate step as part of the LLM prompt to generate the next intermediate step.",
    );
    expect(body()).toContain("A common way to ask a model for one is to end the prompt with “Let's think step by step.”");
  });

  // The worked solutions are ours: no sentence may present them as MATH's.
  it("never presents the worked solutions as MATH's", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/worked solutions from the MATH-500 dataset/i);
  });

  // Paragraph 2 (author, 2026-11-08) only introduces the figure: three MATH-500
  // problems with the dataset's own solutions. No model is named in this step.
  it("introduces the three worked solutions in one sentence, naming no model", () => {
    render(<Page5 />);
    const para = screen.getByText(/Below are three problems from MATH-500/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "Below are three problems from MATH-500, each with the worked solution that comes with the dataset.",
    );
    expect(body()).not.toMatch(/The original way, though/);
    expect(body()).not.toMatch(/Below, the base model/);
  });

  it("marks the techniques and the dataset, resolved in the References sidenote beside the step", () => {
    render(<Page5 />);
    const def = screen.getByText(/A common way to ask a model for one/).closest("p")!;
    expect(Array.from(def.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 1", "reference 2"]);
    const lead = screen.getByText(/Below are three problems from MATH-500/).closest("p")!;
    expect(Array.from(lead.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 3"]);
    // Numbered in order of appearance: the two techniques, then the dataset.
    const refs = screen.getAllByText("References")[0].closest("aside")!;
    expect(Array.from(refs.querySelectorAll("a")).map((a) => a.getAttribute("href"))).toEqual([
      "https://arxiv.org/abs/2201.11903",
      "https://arxiv.org/abs/2205.11916",
      "https://huggingface.co/datasets/HuggingFaceH4/MATH-500",
    ]);
    expect(within(refs).getByRole("link", { name: /Wei et al. 2022/ })).toBeInTheDocument();
    expect(within(refs).getByRole("link", { name: /Kojima et al. 2022/ })).toBeInTheDocument();
    expect(within(refs).getByRole("link", { name: /MATH-500 dataset card/ })).toBeInTheDocument();
  });

  // The model card moved with the old figure 1 (2026-11-08): it is cited where
  // section 2 first names the models, and sits in the sidenote beside that step.
  it("cites the Qwen model card in section 2, where the models are first named", () => {
    render(<Page5 />);
    const intro = screen.getByText(/One trace proves nothing/).closest("p")!;
    expect(Array.from(intro.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 4"]);
    const refs = screen.getAllByText("References")[1].closest("aside")!;
    expect(within(refs).getByRole("link", { name: /Qwen2\.5-3B.*model card/ })).toHaveAttribute(
      "href",
      "https://huggingface.co/Qwen/Qwen2.5-3B",
    );
  });
});

// Since 2026-11-08 (author): the old chat figure's frame, with the question as the
// user's turn and the dataset's own solution under it, one problem at a time.
// Nothing is run.
describe("Page 5, figure 1: worked solutions from MATH-500", () => {
  const figure1 = () => within(screen.getByRole("region", { name: "Worked solutions from MATH-500" }));
  const stepper = () => within(screen.getByRole("group", { name: "Worked problem" }));
  const next = () => stepper().getByRole("button", { name: "Next problem" });
  const prev = () => stepper().getByRole("button", { name: "Previous problem" });

  it("steps through the three chosen problems one at a time, wrapping round", () => {
    render(<Page5 />);
    expect(WORKED_SOLUTIONS.map((w) => w.uniqueId)).toEqual([
      "test/number_theory/515.json",
      "test/algebra/858.json",
      "test/number_theory/13.json",
    ]);
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push(stepper().getByText(/^problem \d of 3/).textContent);
      fireEvent.click(next());
    }
    expect(seen).toEqual([
      "problem 1 of 3 · Number Theory · level 3",
      "problem 2 of 3 · Algebra · level 4",
      "problem 3 of 3 · Number Theory · level 5",
    ]);
    fireEvent.click(prev());
    expect(stepper().getByText("problem 3 of 3 · Number Theory · level 5")).toBeInTheDocument();
  });

  it("shows the question as the user's turn, then the worked solution one line per step", () => {
    render(<Page5 />);
    for (const [i, w] of WORKED_SOLUTIONS.entries()) {
      if (i > 0) fireEvent.click(next());
      expect(figure1().getAllByTestId("worked-question")).toHaveLength(1);
      expect(figure1().getByTestId("worked-question").textContent).toBe(tidyMath(w.problem));
      const lines = Array.from(figure1().getByTestId("worked-steps").querySelectorAll("p"));
      expect(lines.map((p) => p.textContent)).toEqual(w.steps.map((s) => tidyMath(s)));
      expect(lines[lines.length - 1].textContent).toContain(w.answer);
    }
  });

  // Page 2's chat template (author, 2026-11-08): the question on the right with the
  // user icon, the reply on the left with the model icon, plain text, no step
  // numbers, no highlighting, nothing to press but the stepper.
  it("follows page 2's chat template, with nothing added", () => {
    render(<Page5 />);
    expect(figure1().getByRole("img", { name: "User" })).toBeInTheDocument();
    expect(figure1().getByRole("img", { name: "Model" })).toBeInTheDocument();
    expect(figure1().queryAllByRole("heading")).toHaveLength(0);
    expect(figure1().queryAllByRole("listitem")).toHaveLength(0);
    expect(figure1().queryByTestId("count-link")).toBeNull();
    expect(figure1().getAllByRole("button").map((b) => b.getAttribute("aria-label"))).toEqual([
      "Previous problem",
      "Next problem",
    ]);
    expect(body()).not.toMatch(/press Play/i);
    expect(body()).not.toMatch(/Final answer:/);
  });
});

// Figure 2 since 2026-11-08 (author): a simple vertical bar chart of the few-shot
// notebook's results dict, zero-shot to 10-shot, placeholder numbers until it lands.
describe("Page 5, figure 2: zero-shot against few-shot", () => {
  const fig2 = () => screen.getByLabelText("Zero-shot against few-shot");

  it("opens on random problems, none of them the 10 examples, without stating how many", () => {
    render(<Page5 />);
    expect(body().replace(/reference \d/g, "")).toContain(
      `One trace proves nothing, so both prompts were run on MATH-500 problems, with Qwen2.5 base models of three sizes: zero-shot, and with 10 worked examples. The worked examples are MATH-500 problems themselves, so they are excluded from testing: every count below is on other problems, chosen at random.`,
    );
  });

  it("carries the zero-vs-ten-shot run's results, unchanged", () => {
    expect(SHOTS.placeholder).toBe(false);
    expect(SHOTS.rows.map((r) => [r.label, r.solved.zero_shot, r.solved["10_shot"]])).toEqual([
      ["Qwen2.5-1.5B", 25, 26.2],
      ["Qwen2.5-3B", 31.9, 37.5],
      ["Qwen2.5-7B", 31.9, 43.8],
    ]);
  });

  it("draws one group of two vertical bars per model, zero-shot and 10-shot, with a legend", () => {
    render(<Page5 />);
    expect(SHOTS.rows.map((r) => r.label)).toEqual(["Qwen2.5-1.5B", "Qwen2.5-3B", "Qwen2.5-7B"]);
    const scales: number[] = [];
    for (const r of SHOTS.rows) {
      expect(r.label).toBe(r.modelId.split("/").pop());
      const group = within(fig2()).getByTestId(`shots-${r.label}`);
      for (const k of SHOT_KEYS) expect(within(group).getByText(SHOT_LABEL[k]).tagName.toLowerCase()).toBe("text");
      const printed = [...group.querySelectorAll("text")].map((t) => t.textContent);
      for (const k of SHOT_KEYS) expect(printed).toContain(`${r.solved[k].toFixed(1)}%`);
      const bars = [...group.querySelectorAll("rect")];
      expect(bars.map((b) => b.querySelector("title")?.textContent)).toEqual(
        SHOT_KEYS.map((k) => `${r.label}, ${SHOT_LABEL[k]}: ${r.solved[k].toFixed(1)}%`),
      );
      // Vertical: one baseline for every bar, height in proportion to the share.
      const bottoms = bars.map((b) => Number(b.getAttribute("y")) + Number(b.getAttribute("height")));
      expect(new Set(bottoms.map((v) => v.toFixed(3))).size).toBe(1);
      SHOT_KEYS.forEach((k, j) => scales.push(Number(bars[j].getAttribute("height")) / r.solved[k]));
    }
    for (const s of scales) expect(s).toBeCloseTo(scales[0], 6);
    expect(within(fig2()).getByText("Accuracy (%)")).toBeInTheDocument();
    const legend = within(fig2()).getAllByRole("listitem").map((li) => li.textContent);
    expect(legend).toEqual(["zero-shot", "10-shot"]);
  });

  it("carries the run's ledger inside the figure card", () => {
    render(<Page5 />);
    const vitals = fig2().querySelector("dl")?.textContent ?? "";
    expect(vitals).toContain("Qwen2.5 base · 1.5B, 3B, 7B");
    expect(fig2().textContent).toContain("Qwen2.5 base models on MATH-500 problems");
    expect(vitals).toContain("MATH-500");
    expect(vitals).not.toContain("n =");
    expect(vitals).not.toContain("replies");
  });

  // The author asked for this annotation to stay. If new numbers fail the data check
  // below, ask the author what it should say; do not just delete it.
  it("annotates the 3B matching the 7B with no examples, leaves the 1.5B out, and the data agrees", () => {
    render(<Page5 />);
    expect(within(fig2()).getByTestId("shots-on-par")).toHaveTextContent("With no examples, 3B matches 7B");
    const [, mid, large] = SHOTS.rows;
    expect(mid.solved.zero_shot).toBe(large.solved.zero_shot);
    const outlined = (label: string) =>
      [...within(fig2()).getByTestId(`shots-${label}`).querySelectorAll("rect")].map((b) =>
        b.getAttribute("class")?.includes("stroke-ink"),
      );
    expect(outlined("Qwen2.5-1.5B")).toEqual([false, false]);
    expect(outlined("Qwen2.5-3B")).toEqual([true, false]);
    expect(outlined("Qwen2.5-7B")).toEqual([true, false]);
  });

  it("says on its face when its numbers are placeholders", () => {
    render(<Page5 />);
    const chip = within(fig2()).queryByTestId("shots-placeholder");
    if (SHOTS.placeholder) expect(chip).toHaveTextContent("placeholder numbers");
    else expect(chip).toBeNull();
  });

  // The old five-shot run's sentences read numbers this figure no longer shows.
  it("drops the sentences that read the old five-shot run", () => {
    render(<Page5 />);
    expect(body()).not.toContain("though less as the model grows");
    expect(body()).not.toContain("by writing a Python program");
  });

  // Shashank's outline asks for this understanding, and the author wants his two
  // sentences on the page verbatim (2026-10-18).
  it("carries Shashank's two sentences verbatim, after the figure", () => {
    render(<Page5 />);
    const quote =
      "By providing the step-by-step intermediate logic in the examples, you force the model to generate its own reasoning pathway before committing to a final answer. This prevents the model from hallucinating a final state because it has to calculate the state sequentially.";
    expect(body()).toContain(quote);
    expect(body().split(quote)).toHaveLength(2); // once
    const para = screen.getByText(/By providing the step-by-step intermediate logic/).closest("p")!;
    const figure = screen.getByLabelText("Zero-shot against few-shot");
    expect(figure.compareDocumentPosition(para) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // The page's colours (author, 2026-10-18): crimson baseline, blue few-shot, orange
  // instruct reasoning.
  it("colours the baseline crimson, few-shot blue and instruct reasoning orange", () => {
    render(<Page5 />);
    const bars = [...within(fig2()).getByTestId("shots-Qwen2.5-1.5B").querySelectorAll("rect")].map((b) =>
      b.getAttribute("class"),
    );
    expect(bars.map((c) => c?.split(" ")[0])).toEqual(["fill-crimson", "fill-wrong"]);
    const fill = (id: string) => screen.getByTestId(id).querySelector("circle")?.getAttribute("class");
    expect(fill("dot-1.5B-few")).toContain("fill-wrong");
    expect(fill("dot-1.5B-instruct")).toContain("fill-compute");
    // The arrow takes the colour of where it ends.
    expect(screen.getByTestId("row-1.5B").querySelector("line")?.getAttribute("class")).toContain("stroke-compute");
  });
});

describe("Page 5, figure 3: instruct models against few-shot base models", () => {
  it("compares the instruct models with no examples against the base models with ten, without stating how many problems", () => {
    render(<Page5 />);
    expect(body()).toContain("Below, each base model with ten examples is compared with its Instruct version with none, on MATH-500.");
    // The two sides were not scored on the same problems; the text never says so.
    expect(body()).not.toContain("the same problems");
    expect(body()).not.toContain("base on");
    expect(body()).not.toContain(`the same ${N} problems`);
    for (const [i, m] of PAGE5.instruct.entries()) {
      expect(SHOTS.rows[i].label).toBe(`Qwen2.5-${m.size}`);
      const tenShot = SHOTS.rows[i].solved["10_shot"] / 100;
      expect(screen.getByTestId(`dot-${m.size}-few`)).toHaveTextContent(pct(tenShot, 1));
      expect(screen.getByTestId(`dot-${m.size}-instruct`)).toHaveTextContent(pct(m.cot.accuracy, 1));
      expect(screen.getByTestId(`row-${m.size}`)).toHaveTextContent(`+${pts(m.cot.accuracy, tenShot)} pts`);
    }
  });

  // Section 3 (author, 2026-11-08: clear and concise): the running cost of the examples,
  // what an instruct model is, then the result, every number read from the runs.
  it("opens on the examples' running cost and says what an Instruct model is", () => {
    render(<Page5 />);
    const para = screen.getByText(/Few-shot prompting has a running cost/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "Few-shot prompting has a running cost: the ten worked examples, about 3,400 tokens, are sent with every question. Post-training pays that cost once. An Instruct model is the base model trained further, with supervised fine-tuning and reinforcement learning, so that it follows instructions and writes out its steps when asked, with no examples in the prompt.",
    );
    // "about 3,400": the median 10-shot prompt, to the nearest 50.
    expect(Math.round(SHOTS.tenShotPromptTokens / 50) * 50).toBe(3400);
    expect(para.querySelector("strong")?.textContent).toBe("Instruct model");
    expect(Array.from(para.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 5"]);
    expect(screen.getByRole("link", { name: /Qwen2\.5 Technical Report/ })).toHaveAttribute(
      "href",
      "https://arxiv.org/abs/2412.15115",
    );
  });

  it("states the result in one paragraph, from the data", () => {
    render(<Page5 />);
    const ten = (i: number) => SHOTS.rows[i].solved["10_shot"] / 100;
    const inst = PAGE5.instruct;
    const gains = inst.map((m, i) => pts(m.cot.accuracy, ten(i)));
    expect(gains).toEqual(["30.0", "26.7", "31.1"]);
    const instTokens = inst[0].cot.medianPromptTokens;
    const ratio = Math.round(SHOTS.tenShotPromptTokens / instTokens / 10) * 10;
    expect(ratio).toBe(40);
    const last = inst.length - 1;
    // The smallest Instruct model really does beat the largest few-shot base model.
    expect(inst[0].cot.accuracy).toBeGreaterThan(ten(last));
    expect(body()).toContain(
      `The Instruct model wins at every size, by ${gains[0]}, ${gains[1]} and ${gains[2]} points, on a prompt about ${ratio} times shorter (${instTokens} tokens against 3,396). The ${inst[0].size} Instruct model (${pct(inst[0].cot.accuracy, 1)}) even beats the ${inst[last].size} base model with examples (${pct(ten(last), 1)}).`,
    );
  });

  // Shashank's "efficiently": what each side reads before it answers, in the legend.
  // The few-shot prompt carries the ten examples; the instruct prompt carries none.
  // One tokenizer, so the length is the same at every size.
  it("gives each side's prompt length", () => {
    render(<Page5 />);
    const inst = PAGE5.instruct.map((m) => m.cot.medianPromptTokens);
    expect(new Set(inst).size).toBe(1);
    expect([SHOTS.tenShotPromptTokens, inst[0]]).toEqual([3396, 88]);
    const fig = screen.getByLabelText("Base model with few-shot CoT prompting versus Instruct model");
    const legend = fig.querySelector("ul")!;
    expect(legend).toHaveTextContent("from: Base model with few-shot CoT prompting (ten examples)· prompt 3,396 tokens");
    expect(legend).toHaveTextContent("to: Instruct model (no examples)· prompt 88 tokens");
    // The labels and the caption use section 3's names for the two sides.
    expect(fig.querySelector("figcaption")).toHaveTextContent(
      "Base model with few-shot CoT prompting vs Instruct model: Qwen2.5 on MATH-500How many problems each solved, and the Instruct model's lead in points",
    );
  });
});


describe("Page 5: provenance and what the page may claim", () => {
  it.each([
    ["zero-shot vs few-shot", "5_CoT_ZeroShot-vs-FewShot.ipynb", "228 KB"],
    ["base few-shot vs instruct", "5_CoT_BaseFewShot-vs-Instruct.ipynb", "908 KB"],
  ])("links the %s notebook directly, beside the title", (label, file, size) => {
    render(<Page5 />);
    const link = screen.getByRole("link", { name: new RegExp(`download the ${label} notebook`, "i") });
    expect(link).toHaveAttribute("href", `/notebooks/${file}`);
    expect(link).toHaveTextContent(`Download the ${label} notebook (ipynb, ${size})`);
    expect(link).toHaveAttribute("download");
    expect(link.parentElement?.parentElement?.querySelector("h1")).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("says reasoning and non-reasoning, never the old euphemisms", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/forbidden to reason/i);
    expect(body()).not.toMatch(/left alone/i);
    // "allowed to reason longer" is the author's closing (2026-11-08), a general
    // claim and not a name for a condition; the euphemism stays banned otherwise.
    expect(body()).not.toMatch(/allowed to reason(?! longer)/i);
  });

  it("carries no provenance prose and no grader talk", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/math_verify|sha256|notebook run|replay/i);
  });

  it("closes on the cost and what the figures show, with no page number and no handoff question", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "A chain of thought makes a model better at hard problems, and it charges for that in additional time and tokens. Smaller models can outperform larger models when allowed to reason longer, especially with examples of CoT provided at post-training or at inference-time. Post-training beats few-shot inference-time CoT prompting by good margins.",
    );
    expect(body()).not.toContain("Page 6 asks");
  });

  // The closing's two claims, held to the data so they cannot outlive it.
  it("backs the closing's claims with the figures' numbers", () => {
    const shot = (size: string) => SHOTS.rows.find((r) => r.label === `Qwen2.5-${size}`)!.solved;
    const instruct = (size: string) => PAGE5.instruct.find((m) => m.size === size)!.cot.accuracy * 100;
    // Smaller beats larger: with examples at inference time (3B ten-shot over 7B
    // zero-shot) and after post-training (1.5B Instruct over 7B ten-shot).
    expect(shot("3B")["10_shot"]).toBeGreaterThan(shot("7B").zero_shot);
    expect(instruct("1.5B")).toBeGreaterThan(shot("7B")["10_shot"]);
    // Post-training beats ten-shot prompting at every size, by a good margin.
    for (const size of ["1.5B", "3B", "7B"]) {
      expect(instruct(size) - shot(size)["10_shot"]).toBeGreaterThan(20);
    }
  });

  it("has no em dash anywhere in its copy", () => {
    render(<Page5 />);
    expect(body()).not.toContain("—");
  });
});
