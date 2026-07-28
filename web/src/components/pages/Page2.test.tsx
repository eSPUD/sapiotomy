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
    // At the default cutoff (Jan 2025) sealed memory answers "One."
    expect(screen.getByText(/“One\.”/)).toBeInTheDocument();
  });

  it("the cutoff slider changes the recalled answer", () => {
    render(<Page2 />);
    const slider = screen.getByRole("slider", { name: /training cutoff/i });
    // Past the 2026 final, sealed memory catches up: it answers "Two."
    fireEvent.change(slider, { target: { value: String(2026 * 12 + 11) } });
    expect(screen.getByText(/“Two\.”/)).toBeInTheDocument();
  });

  it("explains, after the widget, that the fix is fetching the fact, not thinking harder", () => {
    render(<Page2 />);
    expect(screen.getByText(/answers one short/i)).toBeInTheDocument();
    expect(screen.getByText(/The fix is not to think harder/i)).toBeInTheDocument();
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

  it("keeps citations in the sidenotes, not inline in the prose", () => {
    render(<Page2 />);
    // No bracketed inline cites anywhere on the page.
    expect(document.body.textContent ?? "").not.toMatch(/\[[A-Z][a-z]+ et al\.,? \d{4}\]/);
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
