import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Deterministic reduced-motion (nothing on this page animates, but the stub
// keeps the environment consistent with the other page tests).
const mm = (q: string) => ({
  matches: q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page6 } from "./Page6";
import { THINK_BUDGET } from "@/lib/authored";

const T = THINK_BUDGET;
const CAP = T.steps.reduce((n, s) => n + s.words, 0);

const slider = () => screen.getByRole("slider", { name: /working budget/i });
const drag = (v: number) => fireEvent.change(slider(), { target: { value: String(v) } });

describe("Page 6 (Thinking Longer)", () => {
  it("starts at budget zero: the System-1 blurt, depth 0, steps unafforded", () => {
    render(<Page6 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Thinking Longer");
    expect(screen.getByText(T.question)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`✗\\s*${T.blurt}`))).toBeInTheDocument();
    expect(screen.getByText(`0 of ${T.steps.length} steps written`)).toBeInTheDocument();
    expect(screen.getByText(`0 of ${CAP} words spent`)).toBeInTheDocument();
    // No step text is afforded yet.
    expect(screen.queryByText(T.steps[0].text)).toBeNull();
    expect(screen.getAllByText(/· · · \(not written\)/).length).toBe(T.steps.length);
  });

  it("a partial budget affords whole steps in order and lands the mid-chain cut", () => {
    render(<Page6 />);
    // Enough for the first two steps (9 + 13), not the third.
    drag(T.steps[0].words + T.steps[1].words);
    expect(screen.getByText(T.steps[0].text)).toBeInTheDocument();
    expect(screen.getByText(T.steps[1].text)).toBeInTheDocument();
    expect(screen.queryByText(T.steps[2].text)).toBeNull();
    expect(screen.getByText(`2 of ${T.steps.length} steps written`)).toBeInTheDocument();
    expect(screen.getByText(/out of budget mid-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/stopped after step 2/i)).toBeInTheDocument();
  });

  it("a step that does not wholly fit is not afforded", () => {
    render(<Page6 />);
    drag(T.steps[0].words + T.steps[1].words - 1);
    expect(screen.getByText(T.steps[0].text)).toBeInTheDocument();
    expect(screen.queryByText(T.steps[1].text)).toBeNull();
    expect(screen.getByText(`1 of ${T.steps.length} steps written`)).toBeInTheDocument();
    expect(screen.getByText(`${T.steps[0].words} of ${CAP} words spent`)).toBeInTheDocument();
  });

  it("the full budget completes the chain and flips the answer to 1,772", () => {
    render(<Page6 />);
    drag(CAP);
    for (const s of T.steps) {
      expect(screen.getByText(s.text)).toBeInTheDocument();
    }
    expect(
      screen.getByText(`${T.steps.length} of ${T.steps.length} steps written`),
    ).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`✓\\s*${T.display}`))).toBeInTheDocument();
    expect(screen.queryByText(/out of budget/i)).toBeNull();
  });

  it("carries the System 1/2 band, the tokens-as-currency line, and the s1 inset", () => {
    render(<Page6 />);
    expect(screen.getByText("System 1 · the blurt")).toBeInTheDocument();
    expect(screen.getByText("System 2 · the chain")).toBeInTheDocument();
    expect(screen.getByText(/are tokens/i)).toBeInTheDocument();
    // The measured trade: s1 budget forcing, 50% -> 57%.
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("57%")).toBeInTheDocument();
    expect(screen.getByText(/inference-time scaling in its simplest form/i)).toBeInTheDocument();
  });

  it("puts each reference in the margin beside the step that uses it, with no footnote or how-to rail", () => {
    render(<Page6 />);
    // Grounding for step 1 sits in step 1's margin note.
    expect(screen.getByText(/Kojima et al. 2022/)).toBeInTheDocument();
    expect(screen.getByText(/Feng et al. 2023/)).toBeInTheDocument();
    // The measured result is credited beside step 3, badge included.
    expect(screen.getAllByText(/Muennighoff et al. 2025/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Muennighoff et al. 2025/ })).toHaveAttribute(
      "href",
      "https://arxiv.org/abs/2501.19393",
    );
    // Page-1 shell: no sticky instructions rail, no jargon footnote.
    expect(screen.queryByText(/how to read this page/i)).toBeNull();
    expect(screen.queryByText(/arXiv:2205.11916/)).toBeNull();
    expect(screen.queryByText(/whitespace/i)).toBeNull();
  });

  it("says out loud that a model cannot be held to a one-word answer", () => {
    render(<Page6 />);
    expect(screen.getByText(/cannot really hold a model to one word/i)).toBeInTheDocument();
    expect(screen.getByText(/told to think longer/i)).toBeInTheDocument();
  });
});
