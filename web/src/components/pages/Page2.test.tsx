import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

// No motion or timers to stub anymore: Page 2 is a static contrast diagram.
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

describe("Page 2 (The Knowledge Gap): a static two-road contrast", () => {
  it("shows the question and both roads, fully drawn, from first paint", () => {
    render(<Page2 />);
    expect(screen.getByText(WC.question)).toBeInTheDocument();
    // Both roads are present as labelled groups.
    expect(screen.getByRole("group", { name: /sealed memory · recall path/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /retrieval · fetch path/i })).toBeInTheDocument();
    // At the default cutoff (Jan 2025) recall stops one short; retrieval fetches it.
    expect(screen.getByText(/✗ “One\.”/)).toBeInTheDocument();
    expect(screen.getByText(/✓ “Two\.”/)).toBeInTheDocument();
  });

  it("the cutoff slider changes what sealed memory can recall", () => {
    render(<Page2 />);
    const slider = screen.getByRole("slider", { name: /training cutoff/i });
    const recall = () => screen.getByRole("group", { name: /sealed memory · recall path/i });
    // Before Spain's first title (2010) the model knows none of them.
    fireEvent.change(slider, { target: { value: String(2007 * 12) } });
    expect(within(recall()).getByText(/✗ “Zero\.”/)).toBeInTheDocument();
    // Past the 2026 final, sealed memory catches up and the gap closes.
    fireEvent.change(slider, { target: { value: String(2027 * 12 + 11) } });
    expect(within(recall()).getByText(/✓ “Two\.”/)).toBeInTheDocument();
  });

  it("shows the analysis, the retrieval framing, the teaser, and the flag with no interaction", () => {
    render(<Page2 />);
    expect(screen.getByText(/It only looks like a lookup/i)).toBeInTheDocument();
    expect(screen.getByText(/trained it on data that includes that final/)).toBeInTheDocument();
    expect(screen.getByText(/verify the final's result before shipping/)).toBeInTheDocument();
    expectRetrievalFraming();
  });

  it("no longer renders the removed stepper or guess controls", () => {
    render(<Page2 />);
    expect(screen.queryByRole("button", { name: /next ▸/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /▶ play/i })).toBeNull();
    expect(screen.queryByText(/step 0 of 4/i)).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
