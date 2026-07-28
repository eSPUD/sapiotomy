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

describe("Page 2 (Knowing What You Know): a training-cutoff slider", () => {
  it("shows the question and the cutoff slider, answering one short by default", () => {
    render(<Page2 />);
    // Both widgets pose the same question; only the reading of it differs.
    expect(screen.getAllByText(WC.question)).toHaveLength(2);
    expect(screen.getAllByRole("slider", { name: /training cutoff/i })).toHaveLength(2);
    // At the default cutoff (Jan 2025) it answers off a memory that predates 2026.
    expect(screen.getByText(/won the FIFA World Cup once, in 2010/i)).toBeInTheDocument();
    // Both widgets sit one title behind at the default cutoff: section 1 misses
    // 2026, section 2 names 2023 but is still missing 2026.
    expect(screen.getAllByText(/one short/i)).toHaveLength(2);
    // The pedagogically critical property: the stale reply never names 2026.
    expect(screen.getByText(/won the FIFA World Cup once, in 2010/i).textContent).not.toMatch(
      /2026/,
    );
  });

  it("the cutoff slider changes the recalled answer", () => {
    render(<Page2 />);
    const slider = screen.getAllByRole("slider", { name: /training cutoff/i })[0];
    // Past the 2026 final, sealed memory catches up and names both men's titles.
    fireEvent.change(slider, { target: { value: String(2026 * 12 + 11) } });
    expect(screen.getByText(/twice, in 2010 and 2026/i)).toBeInTheDocument();
  });

  it("section 2 shows the bias: the question never said men's", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/The question never said men's/i);
    expect(body).toMatch(/three\s*FIFA World Cups/i);
    expect(body).toMatch(/women's team in 2023/i);
    // The point that makes it a DIFFERENT failure from the knowledge gap.
    expect(body).toMatch(/happened\s*before\s*the cutoff/i);
  });

  it("section 2's widget reads the question literally and answers better", () => {
    render(<Page2 />);
    const inclusive = screen.getAllByRole("slider", { name: /training cutoff/i })[1];
    // At the default cutoff it already counts the 2023 women's title...
    expect(
      screen.getByText(/two FIFA World Cups: the men's team in 2010 and the women's team in 2023/i),
    ).toBeInTheDocument();
    // ...and past the 2026 final it reaches all three.
    fireEvent.change(inclusive, { target: { value: String(2026 * 12 + 11) } });
    expect(screen.getByText(/three FIFA World Cups/i)).toBeInTheDocument();
  });

  it("says fixing the bias does not fix the cutoff", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").toMatch(/Two separate failures/i);
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
    // One marker per work, at the claim it supports.
    expect(marks).toHaveLength(5);
    expect([...cited].sort()).toEqual(["1", "2", "3", "4", "5"]);
    // ...and each number has a matching entry in a References note.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/1\.\s*Zhao et al/);
    expect(body).toMatch(/2\.\s*Huang et al/);
    expect(body).toMatch(/3\.\s*Yao et al/);
    expect(body).toMatch(/4\.\s*Schick et al/);
    expect(body).toMatch(/5\.\s*Qu et al/);
  });

  it("cites the tool-awareness sources in the references note", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/MetaTool: Benchmarking LLMs on Tool Usage Awareness/i);
    expect(body).toMatch(/ReAct: Synergizing Reasoning and Acting/i);
    expect(body).toMatch(/Toolformer: Language Models Can Teach Themselves to Use\s*Tools/i);
    expect(body).toMatch(/Tool Learning with Large Language Models: A Survey/i);
    expect(body).toMatch(/Gender Bias in Coreference Resolution/i);
  });

  it("keeps Act 1's em-dash-free copy rule", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").not.toMatch(/—/);
  });

  it("closes on the bridge from looking it up to thinking harder", () => {
    render(<Page2 />);
    expect(screen.getByText(/does it know when to/i)).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(/think harder/i);
  });

  it("does not render the removed stepper, roads, or guess controls", () => {
    render(<Page2 />);
    expect(screen.queryByRole("button", { name: /next ▸/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /▶ play/i })).toBeNull();
    expect(screen.queryByRole("group", { name: /recall path/i })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
