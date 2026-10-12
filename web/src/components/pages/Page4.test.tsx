import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

// Reduced motion is ON by default: no Play button, the walkthrough is a manual
// stepper, and every assertion is timer-free. The animated block below flips
// it OFF to cover Play's auto-advance.
let reducedMotion = true;
const mm = (q: string) => ({
  matches: reducedMotion && q.includes("prefers-reduced-motion"),
  media: q,
  addEventListener: () => {},
  removeEventListener: () => {},
  addListener: () => {},
  removeListener: () => {},
  onchange: null,
  dispatchEvent: () => false,
});
vi.stubGlobal("matchMedia", mm);

import { Page4 } from "./Page4";
import { MULT_METHODS } from "@/lib/authored";

const M = MULT_METHODS;

// Act 1's hard rule: the Act 2+ jargon never appears. The lede's one mention of
// "Inference" is named only in the page title, the closing box, which defines
// inference-time scaling for Act 2, and the note beside it; everywhere else on
// the page it stays banned.
const BANNED = /inference/i;
const expectClean = () => {
  const body = document.body.cloneNode(true) as HTMLElement;
  body.querySelector("h1")?.remove();
  body.querySelector('[aria-label="Where this leaves us"]')?.remove();
  // ...and the "Also called" note beside it, which lists the term's other names.
  [...body.querySelectorAll("aside")].find((a) => a.textContent?.startsWith("Also called"))?.remove();
  expect(body.textContent ?? "").not.toMatch(BANNED);
};

const methodSelect = () => screen.getByRole("combobox", { name: /method/i });
const pick = (key: string) => fireEvent.change(methodSelect(), { target: { value: key } });
const next = () => fireEvent.click(screen.getByRole("button", { name: /next/i }));
const walk = (n: number) => {
  for (let i = 0; i < n; i++) next();
};

describe("Page 4 (From Reasoning to Inference-Time Scaling)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("shows everything up front: dropdown, panel, trade-off cards, closing box", () => {
    render(<Page4 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "From Reasoning to Inference-Time Scaling",
    );
    // The dropdown carries all three methods.
    expect(methodSelect()).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    // No pop-ups: the meaning band and the finale are on from first paint —
    // each method's name shows in its option AND its meaning card.
    for (const m of [M.standard, M.lines, M.vedic]) {
      expect(screen.getAllByText(m.name).length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText(new RegExp(m.limitation.slice(0, 24))).length).toBeGreaterThan(0);
    }
    // Step 1 opens on the idea before the walkthrough.
    expect(document.body.textContent).toMatch(
      /The same multiplication can be worked out in very different ways\. Here are three, each\s*from a different tradition\./,
    );
    // Step 2 opens on the convergence and the cost of every method, before the cards.
    expect(document.body.textContent).toMatch(
      /land on the correct answer\. Each\s*trades one kind of effort for another, depending on what it asks you to already know\./,
    );
    expect(document.body.textContent).not.toMatch(/Some take more work than others|common tradeoffs/);
    expect(document.body.textContent).not.toMatch(/No method is free/);
    // Step 2's paragraph names the convergence and the trade-offs; the closing box is the claim.
    expect(
      screen.getByText(/All three methods of reasoning through the problem land on the correct answer\./),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/catch those mistakes/);
    expect(
      screen.getByText(/^There is more than one path from what we know to an answer/),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/guide a machine|chart its own road|Act 2 opens that toolbox/);
    // The walkthrough waits at its setup step.
    expect(screen.getByText("step 0 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Press Next/).length).toBeGreaterThan(0);
    expectClean();
  });

  it("reduced motion hides Play: the walkthrough is a manual stepper", () => {
    render(<Page4 />);
    expect(screen.queryByRole("button", { name: /play/i })).toBeNull();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();
  });

  it("standard: four steps land the partial products on 223,300", () => {
    render(<Page4 />);
    walk(1);
    expect(screen.getAllByText(M.standard.rows[0].say).length).toBeGreaterThan(0);
    walk(3);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
    expectClean();
  });

  it("lines: six steps count the crossings and carry to 223,300", () => {
    render(<Page4 />);
    pick("lines");
    expect(screen.getByText("step 0 of 6")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /line multiplication/i })).toBeInTheDocument();
    walk(2);
    // Tens column: the 40-crossing count is narrated.
    expect(screen.getAllByText(M.lines.diagonals[1].say).length).toBeGreaterThan(0);
    walk(4);
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/carry the columns → 223,300/)).toBeInTheDocument();
    expectClean();
  });

  it("vedic: six crosswise steps write the digits right to left", () => {
    render(<Page4 />);
    pick("vedic");
    walk(3);
    // Hundreds column: the three-way crosswise sum with its carry.
    expect(screen.getAllByText(M.vedic.columns[2].say).length).toBeGreaterThan(0);
    expect(screen.getByText(/3×8 \+ 5×3 \+ 0×6 = 39/)).toBeInTheDocument();
    walk(3);
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByText(/= 223,300/)).toBeInTheDocument();
    expectClean();
  });

  it("switching method resets the walkthrough to its setup step", () => {
    render(<Page4 />);
    walk(2);
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    pick("lines");
    expect(screen.getByText("step 0 of 6")).toBeInTheDocument();
    expect(screen.getAllByText(/Press Next/).length).toBeGreaterThan(0);
    // The selected road's limitation rides the panel.
    expect(screen.getAllByText(new RegExp(M.lines.limitation.slice(0, 24))).length).toBeGreaterThan(0);
    expectClean();
  });

  it("back walks the road in reverse", () => {
    render(<Page4 />);
    walk(3);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(M.standard.rows[1].say).length).toBeGreaterThan(0);
  });

  it("never says the banned word on any road at any step", () => {
    render(<Page4 />);
    for (const key of ["standard", "lines", "vedic"]) {
      pick(key);
      for (let i = 0; i < 6; i++) {
        expectClean();
        const btn = screen.getByRole("button", { name: /next/i });
        if ((btn as HTMLButtonElement).disabled) break;
        fireEvent.click(btn);
      }
      expectClean();
    }
  });
});

// The animated path: reduced motion OFF with fake timers, so Play auto-advances
// the walkthrough to the landing and then stops.
describe("Page 4 animated Play (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  /** Each play tick re-arms its timeout in an effect, so flush act() per tick. */
  const tick = (n: number) => {
    for (let i = 0; i < n; i++) {
      act(() => {
        vi.advanceTimersByTime(900 + 20);
      });
    }
  };

  it("Play walks the standard road to the landing, then stops", () => {
    render(<Page4 />);
    const play = screen.getByRole("button", { name: /play/i });
    fireEvent.click(play);
    // Two ticks in: mid-walkthrough.
    tick(2);
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    // Play out the rest: it reaches the landing and stops advancing.
    tick(3);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
    expect(screen.getAllByText(/Same destination: 223,300\./).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /play/i })).toBeDisabled();
    // No stray timer keeps stepping past the end.
    tick(5);
    expect(screen.getByText("step 4 of 4")).toBeInTheDocument();
  });

  it("pressing Next mid-play takes over from the auto-advance", () => {
    render(<Page4 />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));
    tick(1);
    expect(screen.getByText("step 1 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
    // The manual press paused the run: time passing no longer advances it.
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("step 2 of 4")).toBeInTheDocument();
  });

  // The lede names reasoning; the convergence and the trade-offs belong to step 2.
  it("names reasoning in the lede and leaves the convergence to step 2", () => {
    render(<Page4 />);
    const lede =
      screen.getByText(/Working a problem out, instead of recognizing the answer/).textContent ?? "";
    expect(lede).toMatch(/has a name:\s*reasoning\. If you've ever compared answers/);
    expect(lede).not.toMatch(/Reasoning is what inference-time scaling spends/);
    expect(lede).toMatch(/there is rarely only one way to reason through a problem\./);
    expect(lede).not.toMatch(/223,300/);
    // Step 2 owns the convergence.
    expect(screen.getByText(/land on the correct answer/)).toBeInTheDocument();
  });
});

describe("Page 4 layout and copy (Act 1 revisions)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("uses the new headings, the Try it note, and no origin lines", () => {
    render(<Page4 />);
    const h2s = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(h2s[0]).toBe("1. Three ways to work out 350 × 638");
    expect(h2s[1]).toMatch(/^2\. The methods and their trade-offs/);
    expect(h2s[2]).toBe("3. Reasoning beyond mathematics");
    expect(h2s.some((t) => /Where this leaves us/.test(t ?? ""))).toBe(false);
    expect(screen.queryByText(/authored walkthroughs/)).toBeNull();
    expect(screen.getByText("Pick a method, work it through, then try another.")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Vedic multiplication" })).toBeInTheDocument();
    // One trade-off label per card; the walkthrough no longer repeats it.
    expect(screen.getAllByText("Trade-off:")).toHaveLength(3);
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/The limit of this road/);
    expect(body).not.toMatch(/Urdhva|school algorithm|often taught in East Asia/);
    expect(body).not.toMatch(/We showcase only three here/);
    expect(body).not.toMatch(/Three journeys|one problem, three roads/i);
    expect(body).not.toMatch(/limit:|walk the road|fastest road|what each method is good at/);
  });

  it("keeps the margin paired: Try it above the reference in one cell", () => {
    render(<Page4 />);
    const tryIt = screen.getByText("Try it").closest("aside")!;
    const refs = screen.getByText("References").closest("aside")!;
    expect(tryIt.parentElement).toBe(refs.parentElement);
    expect(
      tryIt.compareDocumentPosition(refs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("ends on one closing box, the shared 'Where this leaves us' hand-off", () => {
    const { container } = render(<Page4 />);
    // The walkthrough panel is shaded but unbarred; the takeaway is plain text.
    expect(container.querySelectorAll(".border-l-4.border-compute")).toHaveLength(0);
    const boxes = screen.getAllByRole("complementary", { name: "Where this leaves us" });
    expect(boxes).toHaveLength(1);
    const closing = boxes[0].lastElementChild!; // the text, after the eyebrow
    const paras = [...closing.querySelectorAll("p")].map((q) => q.textContent ?? "");
    expect(paras.join(" ").replace(/\s+/g, " ").trim()).toBe(
      "There is more than one path from what we know to an answer, and reasoning is how we walk them. It pays off most on the hardest questions. Running a trained model to get an answer is called inference. Giving it more computation at that moment, to reason for longer, try more than one path, or check its work, is inference-time scaling: the model itself stays the same, and only the work spent on each answer grows. Act 1 ends on an open question: can a large language model learn to reason through a problem instead of answering on reflex? Act 2 builds that toolbox, one technique at a time, for getting a model to reason its way to an answer.",
    );
    // The two defined terms, then Act 1's open question, are the box's bold.
    expect([...closing.querySelectorAll("strong")].map((b) => b.textContent?.replace(/\s+/g, " ").trim())).toEqual([
      "inference",
      "inference-time scaling",
      "can a large language model learn to reason through a problem instead of answering on reflex?",
    ]);
    // Set upright: the closing box carries no italics.
    expect(closing.querySelector("em, i")).toBeNull();
    expect(screen.getByText(/land on the correct answer/).closest("aside")).toBeNull();
  });

  it("generalises reasoning beyond mathematics in step 3", () => {
    render(<Page4 />);
    const cases = screen.getByRole("region", { name: "Reasoning beyond mathematics" });
    for (const d of ["Planning", "Diagnosis", "Debugging"]) {
      expect(within(cases).getByText(d)).toBeInTheDocument();
    }
    expect(within(cases).getAllByText("Two routes:")).toHaveLength(3);
    // Each question asks for what its routes produce, and matches its starting point.
    expect(within(cases).getByText("When should you leave for a 10 a.m. flight?")).toBeInTheDocument();
    expect(within(cases).getByText("Why does the program crash on large inputs?")).toBeInTheDocument();
    expect(document.body.textContent ?? "").toMatch(
      /The multiplication was a stand-in\. Any problem you cannot answer on sight/,
    );
    // Step 3 also scopes the story: retrieval closed page 2's gap, and is set aside.
    const step3 = screen.getByRole("heading", { level: 2, name: "3. Reasoning beyond mathematics" }).closest("section")!;
    expect(step3.textContent?.replace(/\s+/g, " ")).toMatch(
      /Reasoning works from what you already know, so it can spot a missing fact but not supply it\. On page 2, closing the knowledge gap took a lookup in a current source, which is called retrieval\. This story sets retrieval aside to follow reasoning, the part that fixed the bias and can work out problems nobody has solved yet\./,
    );
    expectClean();
  });

  it("lists inference-time scaling's other names in the note beside the closing box", () => {
    render(<Page4 />);
    const note = screen.getByText("Also called").closest("aside")!;
    for (const name of ["test-time scaling", "test-time compute", "inference-time compute", "reasoning models"]) {
      expect(note.textContent).toContain(name);
    }
  });

  it("has no em dash in its rendered text on any method at any step", () => {
    render(<Page4 />);
    for (const key of ["standard", "lines", "vedic"]) {
      pick(key);
      for (let i = 0; i < 7; i++) {
        expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
        const btn = screen.getByRole("button", { name: /next/i });
        if ((btn as HTMLButtonElement).disabled) break;
        fireEvent.click(btn);
      }
    }
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
  });
});
