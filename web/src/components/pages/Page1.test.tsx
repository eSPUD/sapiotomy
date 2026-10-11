import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Page1 } from "./Page1";
import { SYSTEMS, SYSTEM_EXAMPLES } from "@/lib/authored";

// Page 1 is a System 1 / System 2 contrast: one "Calculate" press reveals the
// fast side at once and plays the slow side one step per beat, then a
// drag-or-select sorting game. The Calculate tests drive the beats with fake timers.
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

describe("Page 1 (Think Fast, Think Slow)", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("keeps the exact H1 the e2e traversal asserts", () => {
    render(<Page1 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Think Fast, Think Slow");
  });

  it("one Calculate button runs both systems in lockstep, System 1 finishing first", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0); // first draw: example 0
    render(<Page1 />);
    // A single control drives the figure; the old per-panel buttons are gone.
    expect(screen.queryByRole("button", { name: /obvious|work it out|next step/i })).toBeNull();
    const s1 = screen.getByRole("region", { name: "System 1" });
    const s2 = screen.getByRole("region", { name: "System 2" });
    const answer = (el: HTMLElement, a: string) => within(el).getByText(a).className;
    expect(answer(s1, SYSTEMS.fast.answer)).toMatch(/invisible/);
    expect(answer(s2, SYSTEMS.slow.answer)).toMatch(/invisible/);
    expect(screen.getAllByText("not started")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    // Both start together: both stopwatches leave "not started" at once.
    expect(screen.queryByText("not started")).toBeNull();
    expect(screen.getByRole("button", { name: /Calculating/ })).toBeDisabled();

    // Beat 1: step 1 appears in both panels at the same moment.
    act(() => vi.advanceTimersByTime(799));
    expect(within(s1).queryByText(`${SYSTEMS.fast.prompt} = ${SYSTEMS.fast.answer}`)).toBeNull();
    expect(within(s2).queryByText(SYSTEMS.slow.steps[0])).toBeNull();
    expect(answer(s1, SYSTEMS.fast.answer)).toMatch(/invisible/);
    act(() => vi.advanceTimersByTime(1));
    expect(within(s1).getByText(`${SYSTEMS.fast.prompt} = ${SYSTEMS.fast.answer}`)).toBeInTheDocument();
    expect(within(s2).getByText(SYSTEMS.slow.steps[0])).toBeInTheDocument();
    // System 1's answer lands with its only step, not a beat later.
    expect(answer(s1, SYSTEMS.fast.answer)).not.toMatch(/invisible/);

    // Beat 2: System 2 writes step 2.
    act(() => vi.advanceTimersByTime(800));
    expect(within(s2).getByText(SYSTEMS.slow.steps[1])).toBeInTheDocument();

    // System 2 keeps its beat; its answer lands with its last step, not after.
    const rest = SYSTEMS.slow.steps.slice(2);
    rest.forEach((line, i) => {
      act(() => vi.advanceTimersByTime(800));
      expect(within(s2).getByText(line)).toBeInTheDocument();
      if (i < rest.length - 1) expect(answer(s2, SYSTEMS.slow.answer)).toMatch(/invisible/);
    });
    expect(answer(s2, SYSTEMS.slow.answer)).not.toMatch(/invisible/);
    expect(screen.getByRole("button", { name: "Calculate" })).toBeEnabled();
  });

  it("reruns the example on screen first, then shuffles; Reset replays the same one", () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    render(<Page1 />);
    const run = () => {
      fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
      act(() => vi.advanceTimersByTime(800 * SYSTEMS.slow.steps.length));
    };
    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).toBeDisabled();
    expect(reset.textContent).toBe(""); // icon only

    // Reset sits left of Calculate.
    const buttons = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(buttons.indexOf("Reset")).toBeLessThan(buttons.indexOf("Calculate"));

    // The first press runs the example already on screen, without shuffling.
    // (With Math.random pinned to 0, a shuffle would have picked example 1.)
    run();
    expect(screen.getByText(SYSTEM_EXAMPLES[0].slow.prompt)).toBeInTheDocument();
    // A later press draws a new one, never the example just shown.
    run();
    expect(screen.queryByText(SYSTEM_EXAMPLES[0].slow.prompt)).toBeNull();
    expect(screen.getByText(SYSTEM_EXAMPLES[1].slow.prompt)).toBeInTheDocument();
    // The closing sentence follows the example on screen.
    expect(document.body.textContent ?? "").toMatch(
      new RegExp(`${SYSTEM_EXAMPLES[1].fast.prompt} is familiar`),
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getAllByText("not started")).toHaveLength(2);
    // After Reset, Calculate replays the same example; the press after that shuffles.
    // (A shuffle from example 1 would have picked example 0.)
    run();
    expect(screen.getByText(SYSTEM_EXAMPLES[1].slow.prompt)).toBeInTheDocument();
    run();
    expect(screen.queryByText(SYSTEM_EXAMPLES[1].slow.prompt)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(
      screen.getByText("Press Calculate again for a new example, or the arrow to replay the same one."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset" })).toBeDisabled();
    random.mockRestore();
  });

  it("numbers the Kahneman, Stanovich & West and Frederick citations inline and in the references note", () => {
    const { container } = render(<Page1 />);
    // The two-systems framing carries Kahneman's marker, the System 1 / System 2
    // names carry Stanovich & West's, the bat-and-ball question Frederick's...
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks).toHaveLength(3);
    expect(marks[0].textContent).toMatch(/1$/);
    expect(marks[1].textContent).toMatch(/2$/);
    expect(marks[2].textContent).toMatch(/3$/);
    // ...each matching a numbered entry in the References note.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/1\.\s*Daniel Kahneman/);
    expect(body).toMatch(/2\.\s*Stanovich & West/);
    expect(body).toMatch(/3\.\s*Shane Frederick/);
  });

  it("follows System 2's scaling with the language-model analogy in section 3", () => {
    render(<Page1 />);
    const section = screen.getByRole("heading", { name: "3. The difference" }).closest("section")!;
    expect(section.textContent).toMatch(
      /harder ones\s*to get them right\. A language model that answers in a single pass is closest to System 1,\s*and letting it write out its steps first is the nearest thing it has to System 2\./,
    );
  });

  it("states the System 1 / System 2 caveat under the intro", () => {
    render(<Page1 />);
    expect(document.body.textContent ?? "").toMatch(
      /Caveat:\s*System 1\/System 2 is a metaphor for compute\s*regimes, not a claim about cognition or about transformer internals\./,
    );
  });

  it("keeps the Page 2 → nav link the e2e traversal follows", () => {
    render(<Page1 />);
    expect(screen.getByRole("link", { name: /Page 2 →/ })).toBeInTheDocument();
  });
});

describe("Page 1 sorting game (SystemSort)", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("select-then-place locks a correct answer in", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", {
      name: /Sort the questions into System 1 or System 2/i,
    });
    // Select the first pool chip, then place it in System 1.
    const chip = within(game).getByRole("button", { name: /Recognize a friend's face/i });
    fireEvent.click(chip);
    const placeBtns = within(game).getAllByRole("button", { name: /place here/i });
    fireEvent.click(placeBtns[0]); // System 1 bin comes first
    // It now shows locked-in as a list item and left the clickable pool.
    expect(within(game).getByRole("listitem")).toHaveTextContent(/Recognize a friend's face/);
    expect(
      within(game).queryByRole("button", { name: /Recognize a friend's face/i }),
    ).not.toBeInTheDocument();
  });

  it("counts up as items are sorted", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", {
      name: /Sort the questions into System 1 or System 2/i,
    });
    expect(within(game).getByText(/0 \/ 6 sorted/)).toBeInTheDocument();
  });

  // The definition comes after the widgets, so the reader feels both systems
  // first; the close hints at training versus thinking time without naming either.
  it("defines the two systems plainly, then closes on waiting for a reliable answer", () => {
    render(<Page1 />);
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/A good rule of thumb/);
    expect(body).toMatch(/System 2 scales its effort with the problem, spending more time on harder ones\s*to get them right\./);
    expect(body).toMatch(/Sometimes it is worth waiting for a more reliable answer than a quick one\. People switch to\s*System 2 when a problem is long or unfamiliar, and it is usually worth the wait\./);
  });
});

describe("Page 1 copy", () => {
  beforeEach(() => {
    vi.stubGlobal("performance", { now: () => 0 });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.stubGlobal("matchMedia", mm);
  });

  it("opens on the two systems, then goes straight to the panels", () => {
    render(<Page1 />);
    const body = document.body.textContent ?? "";
    expect(body).toMatch(
      /Your mind runs two systems\.(reference 1)?\s*System 1 is fast,\s*automatic, and effortless\. System 2 is slow,\s*deliberate, and effortful\.(reference 2)?\s*You need System 1 to get through the day, and System 2 to get\s*things right\. Try this: a bat and a ball cost \$1\.10 together, and the bat costs \$1\.00\s*more than the ball\. How much is the ball\? The answer that jumps out, 10 cents, is wrong;\s*it's 5 cents\.(reference 3)?/,
    );
    expect(body).not.toMatch(/The human mind runs two systems|One operation, multiplication/);
  });

  it("drops the reveal lines and panel captions, and concludes below the panels", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<Page1 />);
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    act(() => vi.advanceTimersByTime(800 * SYSTEMS.slow.steps.length));
    const body = document.body.textContent ?? "";
    expect(body).not.toMatch(/No computing necessary|Not instant\. You have to build it/);
    expect(body).toMatch(/3 × 4 is familiar, so System 1 recognizes the answer instantly\. 17 × 24\s*is not, so System 2 has to build it step by step, and that takes time\.\s*For a typical person, it takes far longer than the 3\.2\s*seconds\s*shown here\./);
    expect(body).not.toMatch(/Recognition, not work/);
    expect(body).not.toMatch(/You feel every step/);
  });

  it("keeps rendered text free of em dashes, before and after both reveals", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<Page1 />);
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
    fireEvent.click(screen.getByRole("button", { name: "Calculate" }));
    act(() => vi.advanceTimersByTime(800 * SYSTEMS.slow.steps.length));
    expect(document.body.textContent ?? "").not.toMatch(/\u2014/);
  });
});
