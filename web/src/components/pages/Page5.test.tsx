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
      "2. Zero-shot versus few-shot on MATH-500 problems",
      "3. Instruct models, with no examples",
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

  // The worked solutions are ours: the page says so in the words the handoff allows.
  // The worked solutions are ours; the figure's caption on the examples says so in the
  // words the handoff allows.
  it("says the worked solutions were written for this experiment, expanding MATH's own", () => {
    render(<Page5 />);
    expect(screen.getByTestId("examples-caption")).toHaveTextContent(
      "worked solutions written for this experiment, expanding MATH's own solutions.",
    );
    expect(body()).not.toMatch(/worked solutions from the MATH-500 dataset/i);
  });

  // The author's paragraph, cut to two sentences (2026-10-18): the figure carries the
  // rest. Its column titles define zero-shot and few-shot before section 2 uses them,
  // and its picker names the three models.
  it("keeps the paragraph short and lets the figure define the terms", () => {
    render(<Page5 />);
    const para = screen.getByText(/To induce this process/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "To induce this process, it is common to put a few worked examples in the prompt. Below, the base model Qwen2.5-3B answers MATH-500 problems with and without them.",
    );
    expect(body()).not.toMatch(/smallest models/i);
    expect(screen.getByRole("region", { name: "Zero-shot: the problem alone" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Few-shot: after the five worked examples" })).toBeInTheDocument();
  });

  it("marks the techniques and the dataset, resolved in the References sidenote beside the step", () => {
    render(<Page5 />);
    const def = screen.getByText(/A common way to ask a model for one/).closest("p")!;
    expect(Array.from(def.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 1", "reference 2"]);
    const shown = screen.getByText(/To induce this process/).closest("p")!;
    expect(Array.from(shown.querySelectorAll("sup")).map((s) => s.textContent)).toEqual(["reference 3", "reference 4"]);
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
  const zeroShot = () => within(screen.getByRole("region", { name: "Zero-shot: the problem alone" }));
  const fewShot = () => within(screen.getByRole("region", { name: "Few-shot: after the five worked examples" }));
  const playBtn = () => screen.getByRole("button", { name: /▶ play/i });
  const resetBtn = () => screen.getByRole("button", { name: /reset/i });
  const figure = () => within(screen.getByRole("region", { name: "One problem, two prompts" }));

  it("offers the three test problems, the first chosen, and names its one model", () => {
    render(<Page5 />);
    const problems = problemGroup().getAllByRole("button");
    expect(problems.map((b) => b.textContent)).toEqual(["Easy · level 1", "Medium · level 3", "Hard · level 5"]);
    expect(problems[0]).toHaveAttribute("aria-pressed", "true");
    expect(PAGE5.testProblems.map((p) => p.uniqueId)).toEqual([
      "test/intermediate_algebra/134.json",
      "test/algebra/2584.json",
      "test/intermediate_algebra/1994.json",
    ]);
  });

  // One model, the base 3B (author, 2026-10-18): no size picker, and the prose says so.
  it("shows the base Qwen2.5-3B only, with no model picker", () => {
    render(<Page5 />);
    expect(PAGE5.figure1Model.label).toBe("Qwen2.5-3B");
    expect(screen.queryByRole("group", { name: "Base model" })).toBeNull();
    expect(figure().getByText("Qwen2.5-3B")).toBeInTheDocument();
    const para = screen.getByText(/To induce this process/).closest("p")!;
    expect(para.textContent?.replace(/reference \d/g, "").replace(/\s+/g, " ").trim()).toBe(
      "To induce this process, it is common to put a few worked examples in the prompt. Below, the base model Qwen2.5-3B answers MATH-500 problems with and without them.",
    );
  });

  // Fits one screen: the test problem shows once, and the two replies sit side by
  // side with no reply yet.
  it("shows the test problem once and the two replies side by side, nothing revealed yet", () => {
    render(<Page5 />);
    expect(screen.getAllByTestId("test-problem")).toHaveLength(1);
    expect(screen.getByTestId("test-problem")).toHaveTextContent(
      tidyPrompt(PAGE5.testProblems[0].problem).replace(/\s+/g, " ").trim(),
    );
    const split = screen.getByTestId("split");
    expect(split).toHaveClass("sm:grid-cols-2");
    expect([...split.children].map((c) => c.getAttribute("aria-label"))).toEqual([
      "Zero-shot: the problem alone",
      "Few-shot: after the five worked examples",
    ]);
    for (const side of [zeroShot(), fewShot()]) {
      expect(side.getByText("press Play to see its reply")).toBeInTheDocument();
    }
    expect(resetBtn()).toBeDisabled();
  });

  it("Play shows both whole replies, as graded, with their verdicts; Reset clears them", () => {
    render(<Page5 />);
    fireEvent.click(playBtn());
    const r = PAGE5.testProblems[0].replies;
    for (const [side, reply] of [[zeroShot(), r.zeroShot], [fewShot(), r.fewShot]] as const) {
      const text = side.getByTestId("model-reply").textContent ?? "";
      expect(text).toContain(`${reply.correct ? "✓" : "✗"} Final answer: ${tidyPrompt(reply.extracted)}.`);
      expect(text).toContain(`${reply.tokens} tokens`);
      expect(side.getAllByRole("listitem")).toHaveLength(textSteps(gradedText(reply)).length);
    }
    expect(playBtn()).toBeDisabled();
    fireEvent.click(resetBtn());
    expect(zeroShot().getByText("press Play to see its reply")).toBeInTheDocument();
  });

  it("switches the test problem with the replies showing", () => {
    render(<Page5 />);
    fireEvent.click(playBtn());
    for (const [i, p] of PAGE5.testProblems.entries()) {
      fireEvent.click(problemGroup().getAllByRole("button")[i]);
      expect(screen.getByTestId("test-problem")).toHaveTextContent(tidyPrompt(p.problem).replace(/\s+/g, " ").trim());
      for (const [side, reply] of [[zeroShot(), p.replies.zeroShot], [fewShot(), p.replies.fewShot]] as const) {
        const verdict = reply.extracted ? `Final answer: ${tidyPrompt(reply.extracted)}.` : "No boxed answer.";
        expect(side.getByTestId("model-reply")).toHaveTextContent(verdict);
      }
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

  it("lists the five worked examples as rows that open to their steps", () => {
    render(<Page5 />);
    const rows = within(screen.getByTestId("examples")).getAllByRole("listitem", { hidden: true });
    const summaries = screen.getByTestId("examples").querySelectorAll("summary");
    expect(summaries).toHaveLength(5);
    for (const [i, e] of PAGE5.examples.entries()) {
      expect(summaries[i]).toHaveTextContent(`level ${e.level}`);
      expect(summaries[i]).toHaveTextContent(`${textSteps(e.solution).length} steps →`);
    }
    expect(rows.length).toBeGreaterThanOrEqual(5);
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
    expect(body()).toContain(`One trace proves nothing, so both prompts were run across the other ${N} MATH-500 problems, with base models of three sizes.`);
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
    expect(body()).toContain(`The same ${N} problems, put to the instruct versions of the same three models with no examples, against the base models with five.`);
    for (const [i, m] of PAGE5.instruct.entries()) {
      expect(screen.getAllByTestId(`dot-${m.size}-few`)[1]).toHaveTextContent(pct(PAGE5.base[i].fewShot.accuracy, 1));
      expect(screen.getByTestId(`dot-${m.size}-instruct`)).toHaveTextContent(pct(m.cot.accuracy, 1));
      expect(screen.getAllByTestId(`row-${m.size}`)[1]).toHaveTextContent(
        `+${pts(m.cot.accuracy, PAGE5.base[i].fewShot.accuracy)} pts`,
      );
    }
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
