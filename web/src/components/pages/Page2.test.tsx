import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// No motion or timers to stub: Page 2 is a cutoff slider plus prose.
const mm = (q: string) => ({
  matches: false,
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page2 } from "./Page2";
import { SPAIN_WORLD_CUPS } from "@/lib/authored";

const WC = SPAIN_WORLD_CUPS;

// This page deliberately plants the contrast "retrieval adds facts; inference-
// time scaling adds thinking", and must name retrieval (RAG) as the fix.
const expectRetrievalFraming = () => {
  const body = document.body.textContent ?? "";
  expect(body).toMatch(/retrieval-augmented generation/i);
  expect(body).toMatch(/retrieval adds facts\. inference-time scaling adds thinking\./i);
};

describe("Page 2 (The Knowledge Gap): a training-cutoff slider", () => {
  it("shows the question and the cutoff slider, answering one short by default", () => {
    render(<Page2 />);
    expect(screen.getByText(WC.question)).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /training cutoff/i })).toBeInTheDocument();
    // At the default cutoff (Jan 2025) it answers off a memory that predates 2026.
    expect(screen.getByText(/won the FIFA World Cup once, in 2010/i)).toBeInTheDocument();
    expect(screen.getByText(/one short/i)).toBeInTheDocument();
    // The pedagogically critical property: the stale reply never names 2026.
    expect(screen.getByText(/won the FIFA World Cup once, in 2010/i).textContent).not.toMatch(
      /2026/,
    );
  });

  it("the cutoff slider changes the recalled answer", () => {
    render(<Page2 />);
    const slider = screen.getByRole("slider", { name: /training cutoff/i });
    // Past the 2026 final, sealed memory catches up and names both titles.
    fireEvent.change(slider, { target: { value: String(2026 * 12 + 11) } });
    expect(screen.getByText(/twice, in 2010 and 2026/i)).toBeInTheDocument();
    expect(screen.getByText("✓ current")).toBeInTheDocument();
  });

  it("says the fix is fetching the fact, not thinking harder", () => {
    render(<Page2 />);
    expect(screen.getByText(/The gap is knowledge, not thinking/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Thinking harder never conjures a\s*fact the model was never shown/i),
    ).toBeInTheDocument();
  });

  it("names the second miss: the model never judged that it should look it up", () => {
    render(<Page2 />);
    expect(screen.getByText(/Retrieval only helps if something decides to retrieve/i)).toBeInTheDocument();
    expect(screen.getByText(/MetaTool benchmark found most struggle/i)).toBeInTheDocument();
    // The judgment came from outside, via all three elicitation mechanisms.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/judgment was supplied from outside/i);
    expect(body).toMatch(/Prompting: show the pattern/i);
    expect(body).toMatch(/Fine-tuning: train it in/i);
    expect(body).toMatch(/Workflow: build the pipeline around it/i);
    expect(body).toMatch(/ReAct/);
    expect(body).toMatch(/Toolformer/);
  });

  it("keeps author-year citations out of the prose", () => {
    render(<Page2 />);
    // Claims carry numbers; the works themselves live in the sidenotes.
    expect(document.body.textContent ?? "").not.toMatch(/\[[A-Z][a-z]+ et al\.,? \d{4}\]/);
  });

  it("numbers every citation inline and lists the same numbers in the sidenotes", () => {
    const { container } = render(<Page2 />);
    // Every inline marker is a <sup> carrying a reference number.
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks.length).toBeGreaterThan(0);
    const cited = new Set(marks.map((m) => m.textContent?.replace(/\D/g, "")));
    // Toolformer is cited twice (mechanism + caveat), so 6 markers cover 5 works.
    expect(marks).toHaveLength(6);
    expect([...cited].sort()).toEqual(["1", "2", "3", "4", "5"]);
    // ...and each number has a matching entry in a References note.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/1\.\s*Huang et al/);
    expect(body).toMatch(/2\.\s*Yao et al/);
    expect(body).toMatch(/3\.\s*Schick et al/);
    expect(body).toMatch(/4\.\s*Qu et al/);
    expect(body).toMatch(/5\.\s*Lewis et al/);
  });

  it("carries the honesty caveat that Toolformer is a partial counterexample", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/closest thing to a\s*counterexample/i);
    // The precise claim: engineered in, not that it was impossible.
    expect(body).toMatch(/not that such\s*judgment was impossible/i);
    expect(body).toMatch(/engineered in/i);
  });

  it("cites the tool-awareness sources in the references note", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/MetaTool: Benchmarking LLMs on Tool Usage Awareness/i);
    expect(body).toMatch(/ReAct: Synergizing Reasoning and Acting/i);
    expect(body).toMatch(/Toolformer: Language Models Can Teach Themselves to Use\s*Tools/i);
    expect(body).toMatch(/Tool Learning with Large Language Models: A Survey/i);
  });

  it("keeps Act 1's em-dash-free copy rule", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").not.toMatch(/—/);
  });

  it("shows the retrieval framing and the teaser", () => {
    render(<Page2 />);
    expect(screen.getByText(/trained it on data that includes that final/)).toBeInTheDocument();
    expectRetrievalFraming();
  });

  it("does not render the removed stepper, roads, or guess controls", () => {
    render(<Page2 />);
    expect(screen.queryByRole("button", { name: /next ▸/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /▶ play/i })).toBeNull();
    expect(screen.queryByRole("group", { name: /recall path/i })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
