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

  it("shows the retrieval framing, the teaser, and the flag", () => {
    render(<Page2 />);
    expect(screen.getByText(/trained it on data that includes that final/)).toBeInTheDocument();
    expect(screen.getByText(/verify the final's result before shipping/)).toBeInTheDocument();
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
