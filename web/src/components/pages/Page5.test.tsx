import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Page5 } from "./Page5";
import { PAGE5, fewShotPrompt, gradedText, pct, textSteps, tidyPrompt } from "@/lib/page05";

const body = () => (document.body.textContent ?? "").replace(/\s+/g, " ");
const N = PAGE5.n;
const [B15, B3, B7] = PAGE5.base;
const [I15, I3, I7] = PAGE5.instruct;
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
  it("has four steps, in Shashank's order", () => {
    render(<Page5 />);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent ?? "");
    expect(headings).toEqual([
      "1. Chain of Thought (CoT): System 2, written down",
      "2. Zero-shot versus few-shot CoT prompting",
      "3. In post-training: instruct models, with no examples",
      "4. Smaller reasoning models do better than larger non-reasoning models",
    ]);
  });

  it("keeps the author's definition and the classic ask in the cited paper's words", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "We've previously illustrated what step-by-step reasoning looks like for a couple of real-world problems. Chain-of-thought prompting simulates human reasoning by using each intermediate step as part of the LLM prompt to generate the next intermediate step.",
    );
    expect(body()).toContain("A common way to ask a model for one is to end the prompt with “Let's think step by step.”");
  });

  // The worked solutions are ours; the figure's caption on the examples says so in the
  // words the handoff allows.
  it("says the worked solutions were written for this experiment, expanding MATH's own", () => {
    render(<Page5 />);
    fireEvent.click(screen.getByRole("radio", { name: "Few-shot" }));
    expect(screen.getByTestId("examples-caption")).toHaveTextContent(
      "worked solutions written for this experiment, expanding MATH's own solutions.",
    );
    expect(body()).not.toMatch(/worked solutions from the MATH-500 dataset/i);
  });

  // The author's paragraph, cut to two sentences (2026-10-18): the figure carries the
  // rest. Its column titles define zero-shot and few-shot before section 2 uses them,
  // and its picker names the three models.
  // Paragraph 2 is the alternative to paragraph 1's ask, not a second "common way"
  // (author, 2026-10-18), and it is the original one: Wei et al. (reference 1)
  // introduced chain of thought with worked examples.
  it("keeps the paragraph short, opens it as the alternative to asking, and lets the figure define the terms", () => {
    render(<Page5 />);
    const para = screen.getByText(/The original way, though/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "The original way, though, is to show rather than ask: put a few worked examples in the prompt. Below, the base model Qwen2.5-3B answers MATH-500 problems with and without them.",
    );
    expect(body()).not.toMatch(/it is common to put a few worked examples/i);
    expect(body()).not.toMatch(/smallest models/i);
    const prompt = within(screen.getByRole("radiogroup", { name: "Prompt" }));
    expect(prompt.getAllByRole("radio").map((r) => r.textContent)).toEqual(["Zero-shot", "Few-shot"]);
  });

  it("marks the techniques and the dataset, resolved in the References sidenote beside the step", () => {
    render(<Page5 />);
    const def = screen.getByText(/A common way to ask a model for one/).closest("p")!;
    expect(Array.from(def.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 1", "reference 2"]);
    const shown = screen.getByText(/The original way, though/).closest("p")!;
    expect(Array.from(shown.querySelectorAll("sup")).map((s) => s.textContent)).toEqual([
      "reference 1",
      "reference 3",
      "reference 4",
    ]);
    // Numbered in order of appearance: the model card, then the dataset.
    const entries = Array.from(screen.getAllByText("References")[0].closest("aside")!.querySelectorAll("a"));
    expect(entries.map((a) => a.getAttribute("href"))).toEqual([
      "https://arxiv.org/abs/2201.11903",
      "https://arxiv.org/abs/2205.11916",
      "https://huggingface.co/Qwen/Qwen2.5-3B",
      "https://huggingface.co/datasets/HuggingFaceH4/MATH-500",
    ]);
    const refs = screen.getAllByText("References")[0].closest("aside")!;
    expect(within(refs).getByRole("link", { name: /Wei et al. 2022/ })).toBeInTheDocument();
    expect(within(refs).getByRole("link", { name: /Kojima et al. 2022/ })).toBeInTheDocument();
    expect(within(refs).getByRole("link", { name: /MATH-500 dataset card/ })).toHaveAttribute(
      "href",
      "https://huggingface.co/datasets/HuggingFaceH4/MATH-500",
    );
    expect(within(refs).getByRole("link", { name: /Qwen2\.5-3B.*model card/ })).toHaveAttribute(
      "href",
      "https://huggingface.co/Qwen/Qwen2.5-3B",
    );
  });
});

describe("Page 5, figure 1: one problem, two prompts", () => {
  const problemGroup = () => within(screen.getByRole("group", { name: "Test problem" }));
  const modeBtn = (name: "Zero-shot" | "Few-shot") => screen.getByRole("radio", { name });
  const reply = () => screen.getByTestId("model-reply");
  const playBtn = () => screen.getByRole("button", { name: /▶ play/i });
  const resetBtn = () => screen.getByRole("button", { name: /reset/i });
  const figure = () => within(screen.getByRole("region", { name: "One problem, two prompts" }));

  const next = () => problemGroup().getByRole("button", { name: "Next problem" });
  const prev = () => problemGroup().getByRole("button", { name: "Previous problem" });
  const verdict = (r: { extracted: string }) => (r.extracted ? `Final answer: ${tidyPrompt(r.extracted)}.` : "No boxed answer.");

  // One problem at a time (author, 2026-11-05): quiet arrows step through the three, wrapping.
  it("steps through the three test problems one at a time, the first shown", () => {
    render(<Page5 />);
    expect(problemGroup().getAllByRole("button")).toHaveLength(2);
    const seen = [];
    for (let i = 0; i < 3; i++) {
      seen.push(problemGroup().getByText(/^problem \d of 3/).textContent);
      fireEvent.click(next());
    }
    expect(seen).toEqual(["problem 1 of 3 · level 1", "problem 2 of 3 · level 3", "problem 3 of 3 · level 5"]);
    fireEvent.click(prev());
    expect(problemGroup().getByText("problem 3 of 3 · level 5")).toBeInTheDocument();
    expect(PAGE5.testProblems.map((p) => p.uniqueId)).toEqual([
      "test/intermediate_algebra/134.json",
      "test/algebra/2584.json",
      "test/intermediate_algebra/1994.json",
    ]);
  });

  // One model, the base 3B (author, 2026-10-18): no size picker, and the prose names it.
  it("shows the base Qwen2.5-3B only, with no model picker", () => {
    render(<Page5 />);
    expect(PAGE5.figure1Model.label).toBe("Qwen2.5-3B");
    expect(screen.queryByRole("group", { name: "Base model" })).toBeNull();
    const para = screen.getByText(/The original way, though/).closest("p")!;
    expect(para.textContent).toContain("Below, the base model Qwen2.5-3B");
  });

  // As clean as the old figure (author, 2026-11-05): one chat, zero-shot first, the
  // question alone in the user's turn, no reply yet.
  it("opens on one chat, zero-shot, the question alone and nothing revealed", () => {
    render(<Page5 />);
    expect(modeBtn("Zero-shot")).toHaveAttribute("aria-checked", "true");
    expect(screen.getAllByTestId("test-problem")).toHaveLength(1);
    expect(screen.getAllByTestId("model-reply")).toHaveLength(1);
    expect(screen.getByTestId("test-problem")).toHaveTextContent(
      tidyPrompt(PAGE5.testProblems[0].problem).replace(/\s+/g, " ").trim(),
    );
    expect(screen.queryByTestId("worked-example")).toBeNull();
    expect(figure().getByRole("img", { name: "User" })).toBeInTheDocument();
    expect(figure().getByRole("img", { name: "Model" })).toBeInTheDocument();
    expect(within(reply()).getByText("press Play to see its reply")).toBeInTheDocument();
    expect(resetBtn()).toBeDisabled();
  });

  it("Play shows the whole reply, as graded, with its verdict; Reset clears it", () => {
    render(<Page5 />);
    fireEvent.click(playBtn());
    const r = PAGE5.testProblems[0].replies.zeroShot;
    const text = reply().textContent ?? "";
    expect(text).toContain(`${r.correct ? "✓" : "✗"} ${verdict(r)}`);
    expect(text).toContain(`${r.tokens} tokens`);
    expect(within(reply()).getAllByRole("listitem")).toHaveLength(textSteps(gradedText(r)).length);
    expect(playBtn()).toBeDisabled();
    fireEvent.click(resetBtn());
    expect(within(reply()).getByText("press Play to see its reply")).toBeInTheDocument();
  });

  it("switches prompt and problem with the reply showing", () => {
    render(<Page5 />);
    fireEvent.click(playBtn());
    for (const [i, p] of PAGE5.testProblems.entries()) {
      if (i > 0) fireEvent.click(next());
      expect(screen.getByTestId("test-problem")).toHaveTextContent(tidyPrompt(p.problem).replace(/\s+/g, " ").trim());
      fireEvent.click(modeBtn("Zero-shot"));
      expect(reply()).toHaveTextContent(verdict(p.replies.zeroShot));
      fireEvent.click(modeBtn("Few-shot"));
      expect(reply()).toHaveTextContent(verdict(p.replies.fewShot));
    }
  });

  // The 3B's six replies as the run graded them: both right on the easy problem,
  // only few-shot right on the medium one, both wrong on the hard one.
  it("shows the 3B's verdicts as the run graded them", () => {
    expect(PAGE5.testProblems.map((p) => [p.replies.zeroShot.correct, p.replies.fewShot.correct])).toEqual([
      [true, true],
      [false, true],
      [false, false],
    ]);
  });

  // The user's turn is the prompt in one box, so the worked example is plainly part
  // of it (author, 2026-11-05).
  it("puts the prompt in one box, the example inside it under few-shot", () => {
    render(<Page5 />);
    const box = () => screen.getByTestId("prompt");
    expect(box()).toHaveTextContent("the prompt · about 55 tokens");
    expect(box()).toContainElement(screen.getByTestId("test-problem"));
    fireEvent.click(modeBtn("Few-shot"));
    expect(box()).toHaveTextContent("the prompt · about 3,750 tokens");
    expect(box()).toContainElement(screen.getByTestId("worked-example"));
    expect(box()).toContainElement(screen.getByTestId("test-problem"));
  });

  // One worked example, the last of the five, UNDER the test problem (author,
  // 2026-11-05); its lead line keeps the prompt's real order and count.
  it("shows one worked example under the question, saying there are five before it, opening to its steps", () => {
    render(<Page5 />);
    fireEvent.click(modeBtn("Few-shot"));
    const card = screen.getByTestId("worked-example");
    const last = PAGE5.examples[PAGE5.examples.length - 1];
    expect(card).toHaveTextContent("+ one of 5 worked examples, sent before the problem");
    expect(card).toHaveTextContent(`Problem: ${tidyPrompt(last.problem).replace(/\s+/g, " ").trim()}`);
    expect(card.querySelector("summary")).toHaveTextContent(
      `Solution:${textSteps(last.solution).length} worked steps → ${tidyPrompt(last.answer)}`,
    );
    expect(within(card).getAllByRole("listitem", { hidden: true })).toHaveLength(textSteps(last.solution).length);
    expect(card.compareDocumentPosition(screen.getByTestId("test-problem")) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    // Every step of every solution is there to open, nothing dropped.
    for (const e of PAGE5.examples) {
      expect(textSteps(e.solution).join("\n\n").replace(/\s+/g, "")).toBe(e.solution.replace(/\s+/g, ""));
    }
  });

  // The page shows what the notebook sent: Problem / Solution blocks, examples first.
  it("lays the prompt out as the notebook built it", () => {
    const prompt = fewShotPrompt(PAGE5.testProblems[0]);
    expect(prompt.startsWith(`Problem:\n${PAGE5.examples[0].problem}\n\nSolution:\n`)).toBe(true);
    expect(prompt.endsWith(`Problem:\n${PAGE5.testProblems[0].problem}\n\nSolution:\n`)).toBe(true);
    expect(PAGE5.examples.map((e) => e.level)).toEqual([2, 4, 3, 5, 1]);
  });
});

describe("Page 5, figure 2: zero-shot against few-shot", () => {
  it("opens on the denominator before the figure", () => {
    render(<Page5 />);
    expect(N).toBe(495);
    // The old section 2's opening sentence, with the new denominator.
    expect(body()).toContain(`One trace proves nothing, so both prompts were run across MATH-500, with base models of three sizes. The few-shot prompt's five worked examples are MATH-500 problems themselves, so they are excluded from testing: every count below is on the other ${N} problems.`);
    // The five examples are the ones left out: 500 less five is the denominator.
    expect(PAGE5.examples).toHaveLength(5);
    expect(N + PAGE5.examples.length).toBe(500);
  });

  // Dot-and-arrow rows (author, 2026-10-18): a dot where each model starts, an arrow
  // to where it ends, both labelled, and the gain at the right. No bars.
  it("draws one row per size, a dot at each end and an arrow between, labelled with the run's numbers", () => {
    render(<Page5 />);
    for (const row of screen.getAllByTestId(/^row-/)) expect(row.querySelector("rect")).toBeNull();
    for (const m of PAGE5.base) {
      // Figure 3 starts from the few-shot dots too, so figure 2's are the first of each.
      expect(screen.getByTestId(`dot-${m.size}-zero`)).toHaveTextContent(pct(m.zeroShot.accuracy, 1));
      expect(screen.getAllByTestId(`dot-${m.size}-few`)[0]).toHaveTextContent(pct(m.fewShot.accuracy, 1));
      const row = screen.getAllByTestId(`row-${m.size}`)[0];
      expect(row).toHaveTextContent(`+${pts(m.fewShot.accuracy, m.zeroShot.accuracy)} pts`);
      expect(row.querySelector("line")?.getAttribute("marker-end")).toBe("url(#p5-fig2-arrow)");
    }
    expect([B15, B3, B7].map((m) => pct(m.zeroShot.accuracy, 1))).toEqual(["22.8%", "30.7%", "49.7%"]);
    expect([B15, B3, B7].map((m) => pct(m.fewShot.accuracy, 1))).toEqual(["37.6%", "43.2%", "54.9%"]);
  });

  it("carries the run's ledger inside the figure card", () => {
    render(<Page5 />);
    const vitals = screen.getByLabelText("Zero-shot against few-shot").querySelector("dl")?.textContent ?? "";
    expect(vitals).toContain("Qwen2.5 base · 1.5B, 3B, 7B · bf16");
    expect(vitals).toContain("greedy · 1,024-token cap");
    expect(vitals).toContain(`n = ${N} paired`);
    expect(vitals).toContain("2,970 replies");
  });

  // Every number and comparison in the paragraph, against the data.
  it("explains the gain in words the run supports", () => {
    render(<Page5 />);
    const gains = PAGE5.base.map((m) => pts(m.fewShot.accuracy, m.zeroShot.accuracy));
    expect(gains).toEqual(["14.8", "12.5", "5.2"]);
    const g = gains.map(Number);
    expect(g.every((x) => x > 0)).toBe(true); // "help at every size"
    expect(g[0] > g[1] && g[1] > g[2]).toBe(true); // "less as the model grows"
    expect(body()).toContain(`by ${gains[0]}, ${gains[1]} and ${gains[2]} points, though less as the model grows`);
    expect(body()).toContain(`the 7B answers ${B7.zeroShot.wroteCode} of the ${N} problems by writing a Python program`);
    expect(B7.fewShot.wroteCode).toBe(0); // "After the examples, it never does."
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
  // instruct reasoning; few-shot keeps its blue from figure 2 into figure 3.
  it("colours the baseline crimson, few-shot blue and instruct reasoning orange", () => {
    render(<Page5 />);
    const fill = (id: string, k = 0) => screen.getAllByTestId(id)[k].querySelector("circle")?.getAttribute("class");
    expect(fill("dot-1.5B-zero")).toContain("fill-crimson");
    expect(fill("dot-1.5B-few", 0)).toContain("fill-wrong");
    expect(fill("dot-1.5B-few", 1)).toContain("fill-wrong");
    expect(fill("dot-1.5B-instruct")).toContain("fill-compute");
    // Each arrow takes the colour of where it ends.
    const arrow = (k: number) => screen.getAllByTestId("row-1.5B")[k].querySelector("line")?.getAttribute("class");
    expect(arrow(0)).toContain("stroke-wrong");
    expect(arrow(1)).toContain("stroke-compute");
    const floor = screen.getByTestId(`floor-${I15.label}`).querySelectorAll("rect");
    expect(floor[0].getAttribute("class")).toContain("fill-crimson");
    expect(floor[1].getAttribute("class")).toContain("fill-compute");
  });
});

describe("Page 5, figure 3: instruct models against few-shot base models", () => {
  it("compares the instruct models with no examples against the base models with five, on the same problems", () => {
    render(<Page5 />);
    expect(body()).toContain(`Below, the instruct versions of the same three models answer the same ${N} problems with no examples, against the base models with five.`);
    for (const [i, m] of PAGE5.instruct.entries()) {
      expect(screen.getAllByTestId(`dot-${m.size}-few`)[1]).toHaveTextContent(pct(PAGE5.base[i].fewShot.accuracy, 1));
      expect(screen.getByTestId(`dot-${m.size}-instruct`)).toHaveTextContent(pct(m.cot.accuracy, 1));
      expect(screen.getAllByTestId(`row-${m.size}`)[1]).toHaveTextContent(
        `+${pts(m.cot.accuracy, PAGE5.base[i].fewShot.accuracy)} pts`,
      );
    }
  });

  // Section 3 opens by saying what an instruct model is, picking up from section 2's
  // examples (author, 2026-10-18), with the prompt length the figure's legend gives.
  it("opens by saying what an instruct model is, following on from the examples", () => {
    render(<Page5 />);
    const para = screen.getByText(/The worked examples work, but they travel with every question/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "The worked examples work, but they travel with every question: the few-shot prompt runs to around 3,750 tokens before the model writes a word. Instruct models do the showing once, in training. An instruct model is the same base model trained further on instructions paired with good answers, including step-by-step solutions to maths problems, so it writes out its steps with no examples in front of the question.",
    );
    // "around 3,750": the median few-shot prompt, to the nearest 50.
    expect(Math.round(PAGE5.base[0].fewShot.medianPromptTokens / 50) * 50).toBe(3750);
    expect(para.querySelector("strong")?.textContent).toBe("Instruct models");
    expect(Array.from(para.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 5"]);
    expect(screen.getByRole("link", { name: /Qwen2\.5 Technical Report/ })).toHaveAttribute(
      "href",
      "https://arxiv.org/abs/2412.15115",
    );
  });

  // Shashank's "efficiently": what each side reads before it answers, in the legend.
  // The few-shot prompt carries the five examples (3,700 tokens of them); the
  // instruct prompt carries none. One tokenizer, so the length is the same at every size.
  it("gives each side's prompt length, from the notebooks' own counts", () => {
    render(<Page5 />);
    const few = PAGE5.base.map((m) => m.fewShot.medianPromptTokens);
    const inst = PAGE5.instruct.map((m) => m.cot.medianPromptTokens);
    expect(new Set(few).size).toBe(1);
    expect(new Set(inst).size).toBe(1);
    expect([few[0], inst[0]]).toEqual([3755, 88]);
    const legend = screen.getByLabelText("Instruct models against few-shot base models").querySelector("ul")!;
    expect(legend).toHaveTextContent("from: base model, five worked examples· prompt 3,755 tokens");
    expect(legend).toHaveTextContent("to: instruct model, no examples· prompt 88 tokens");
  });
});

describe("Page 5, figure 4: the floor is flat", () => {
  it("defines System 1 here as the final answer only, and checks the models complied", () => {
    render(<Page5 />);
    const floor = Math.floor(Math.min(...PAGE5.instruct.map((m) => m.direct.shortShare!)) * 100);
    expect(floor).toBe(98);
    expect(body()).toContain(`At least ${floor}% of their replies are then 40 tokens or fewer: System 1, answering immediately.`);
  });

  it("states the cross-model result, and its words match the data", () => {
    render(<Page5 />);
    const small = PAGE5.section4.small;
    const large = PAGE5.section4.large;
    expect(body()).toContain(`Forced into System 1, the 7B solves ${pct(large.direct.accuracy, 1)}.`);
    expect(body()).toContain(`In System 2, the 1.5B solves ${pct(small.cot.accuracy, 1)}`);
    expect(1.5 / 7).toBeLessThan(0.25); // "less than a quarter the size"
    expect(small.cot.accuracy / large.direct.accuracy).toBeGreaterThanOrEqual(2); // "twice as well"
    // "Every model in System 2 beats every model in System 1."
    expect(Math.min(...PAGE5.instruct.map((m) => m.cot.accuracy))).toBeGreaterThan(
      Math.max(...PAGE5.instruct.map((m) => m.direct.accuracy)),
    );
  });

  it("prices the steps in tokens, rounded the way the sentence says", () => {
    render(<Page5 />);
    const mean = PAGE5.instruct.reduce((a, m) => a + m.cot.medianTokens, 0) / 3;
    expect(Math.round(mean / 10) * 10).toBe(450);
    expect([I15, I3, I7].every((m) => m.direct.medianTokens === 6)).toBe(true);
    expect(body()).toContain("a median of around 450 tokens per problem, against 6.");
  });

  it("splits each checkpoint's bar at its non-reasoning accuracy, with no size axis", () => {
    render(<Page5 />);
    for (const m of PAGE5.instruct) {
      const row = screen.getByTestId(`floor-${m.label}`);
      expect(row).toHaveTextContent(pct(m.cot.accuracy, 1));
      expect(row).toHaveTextContent(`+${pts(m.cot.accuracy, m.direct.accuracy)}`);
    }
    const chart = screen.getByRole("img", { name: /each bar split into the part it keeps non-reasoning/ });
    expect(chart.getAttribute("aria-label")).not.toMatch(/parameters|scale/i);
    const vitals = screen.getByLabelText("The floor is flat").querySelector("dl")?.textContent ?? "";
    expect(vitals).toContain("Qwen2.5-Instruct · 1.5B, 3B, 7B · bf16");
  });
});

describe("Page 5: provenance and what the page may claim", () => {
  it("links the two notebooks as one zip, beside the title", () => {
    render(<Page5 />);
    const link = screen.getByRole("link", { name: /download the notebooks/i });
    expect(link).toHaveAttribute("href", "/notebooks/page-05-chain-of-thought.zip");
    expect(link).toHaveTextContent("Download the notebooks (zip, 14 KB)");
    expect(link).toHaveAttribute("download");
    expect(link.parentElement?.querySelector("h1")).toBe(screen.getByRole("heading", { level: 1 }));
  });

  it("says reasoning and non-reasoning, never the old euphemisms", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/forbidden to reason/i);
    expect(body()).not.toMatch(/left alone/i);
    expect(body()).not.toMatch(/allowed to reason/i);
  });

  it("carries no provenance prose and no grader talk", () => {
    render(<Page5 />);
    expect(body()).not.toMatch(/math_verify|sha256|notebook run|replay/i);
  });

  it("closes on the cost, with no page number and no handoff question", () => {
    render(<Page5 />);
    expect(body()).toContain(
      "A chain of thought makes a model better at hard problems, and it charges for that in tokens.",
    );
    expect(body()).not.toContain("Page 6 asks");
  });

  it("has no em dash anywhere in its copy", () => {
    render(<Page5 />);
    expect(body()).not.toContain("—");
  });
});
