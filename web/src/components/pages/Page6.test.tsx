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
    expect(screen.getByText(`depth 0 of ${T.steps.length}`)).toBeInTheDocument();
    expect(screen.getByText(`0 of ${CAP} words spent`)).toBeInTheDocument();
    // No step text is afforded yet.
    expect(screen.queryByText(T.steps[0].text)).toBeNull();
    expect(screen.getAllByText(/· · · \(not yet afforded\)/).length).toBe(T.steps.length);
  });

  it("a partial budget affords whole steps in order and lands the mid-chain cut", () => {
    render(<Page6 />);
    // Enough for the first two steps (9 + 13), not the third.
    drag(T.steps[0].words + T.steps[1].words);
    expect(screen.getByText(T.steps[0].text)).toBeInTheDocument();
    expect(screen.getByText(T.steps[1].text)).toBeInTheDocument();
    expect(screen.queryByText(T.steps[2].text)).toBeNull();
    expect(screen.getByText(`depth 2 of ${T.steps.length}`)).toBeInTheDocument();
    expect(screen.getByText(/out of budget mid-chain/i)).toBeInTheDocument();
    expect(screen.getByText(/cut after step 2/i)).toBeInTheDocument();
  });

  it("a step that does not wholly fit is not afforded", () => {
    render(<Page6 />);
    drag(T.steps[0].words + T.steps[1].words - 1);
    expect(screen.getByText(T.steps[0].text)).toBeInTheDocument();
    expect(screen.queryByText(T.steps[1].text)).toBeNull();
    expect(screen.getByText(`depth 1 of ${T.steps.length}`)).toBeInTheDocument();
    expect(screen.getByText(`${T.steps[0].words} of ${CAP} words spent`)).toBeInTheDocument();
  });

  it("the full budget completes the chain and flips the answer to 1,772", () => {
    render(<Page6 />);
    drag(CAP);
    for (const s of T.steps) {
      expect(screen.getByText(s.text)).toBeInTheDocument();
    }
    expect(screen.getByText(`depth ${T.steps.length} of ${T.steps.length}`)).toBeInTheDocument();
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
    // The requested grounding citations ride the footer (and are named again in
    // the sidebar rail, so these are getAllByText).
    expect(screen.getAllByText(/Kojima et al. 2022/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Feng et al. 2023/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Merrill & Sabharwal 2024/).length).toBeGreaterThan(0);
  });
});
