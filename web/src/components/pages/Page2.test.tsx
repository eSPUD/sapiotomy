import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

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
import { SPAIN_SYSTEM2_TRACE, SPAIN_WORLD_CUPS } from "@/lib/authored";

const WC = SPAIN_WORLD_CUPS;

describe("Page 2 (Answering Questions in the Real World): a training-cutoff slider", () => {
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
    // Past the 2026 final, sealed memory catches up and names both men's titles.
    fireEvent.change(slider, { target: { value: String(2026 * 12 + 11) } });
    expect(screen.getByText(/twice, in 2010 and 2026/i)).toBeInTheDocument();
  });

  it("section 2 shows the bias: the question never said men's", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/The question never said men's/i);
    // The ideal answer is quoted like a model reply, naming both teams.
    const ideal = screen.getByRole("region", { name: /The ideal answer/i });
    expect(within(ideal).getByText(/men's team in 2010 and 2026, and the women's team in 2023/i))
      .toBeInTheDocument();
    expect(within(ideal).getByText(/all 3 titles/i)).toBeInTheDocument();
    // The point that makes it a DIFFERENT failure from the knowledge gap.
    expect(body).toMatch(/happened\s*before\s*the cutoff/i);
    expect(body).toMatch(/knowledge bias/i);
    expect(body).toMatch(
      /the gap is about what the model was never shown, the\s*bias about which part of what it holds it decides to use/i,
    );
  });


  it("section 3 walks a System 2 trace that lands on three titles", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    // Every authored step is on screen, in order, as a numbered list.
    for (const step of SPAIN_SYSTEM2_TRACE.steps) {
      expect(screen.getByText(new RegExp(step.slice(0, 40).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")))
        .toBeInTheDocument();
    }
    expect(body).toMatch(/Three\./);
  });

  it("is honest that thinking settles the bias but cannot conjure the missing fact", () => {
    render(<Page2 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/needed no new information/i);
    expect(body).toMatch(/thinking cannot conjure a fact the\s*model was never shown/i);
    // ...and that the model itself did not change, only the effort it spent.
    expect(body).toMatch(/spent effort before answering/i);
  });

  it("keeps author-year citations out of the prose", () => {
    render(<Page2 />);
    // Claims carry numbers; the works themselves live in the sidenotes.
    expect(document.body.textContent ?? "").not.toMatch(/\[[A-Z][a-z]+ et al\.,? \d{4}\]/);
  });

  it("numbers every citation inline and lists the same numbers in the sidenotes", () => {
    const { container } = render(<Page2 />);
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toMatch(/1$/);
    expect(document.body.textContent ?? "").toMatch(/1\.\s*Zhao et al/);
  });

  it("cites the bias source", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").toMatch(/Gender Bias in Coreference Resolution/i);
  });

  it("keeps Act 1's em-dash-free copy rule", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").not.toMatch(/—/);
  });

  it("closes by handing the effort question to the rest of the story", () => {
    render(<Page2 />);
    expect(document.body.textContent ?? "").toMatch(
      /the subject of the rest\s*of this story/i,
    );
  });

  it("does not render the removed stepper, roads, or guess controls", () => {
    render(<Page2 />);
    expect(screen.queryByRole("button", { name: /next ▸/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /▶ play/i })).toBeNull();
    expect(screen.queryByRole("group", { name: /recall path/i })).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
