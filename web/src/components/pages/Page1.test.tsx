import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { Page1 } from "./Page1";
import { SYSTEMS, SYSTEM_EXAMPLES } from "@/lib/authored";

// Page 1 is a System 1 / System 2 contrast: one "Calculate" press reveals the
// fast side at once and plays the slow side one step per beat, then a
// click-to-pick game (find the System 2 tasks). The Calculate tests drive the beats with fake timers.
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
    // With both systems done, Calculate greys out: only Reset brings a new problem.
    expect(screen.getByRole("button", { name: "Calculate" })).toBeDisabled();
  });

  it("Calculate runs the problem on screen once; only Reset brings a new one", () => {
    vi.useFakeTimers();
    const random = vi.spyOn(Math, "random").mockReturnValue(0);
    render(<Page1 />);
    const calc = () => screen.getByRole("button", { name: "Calculate" });
    const run = () => {
      fireEvent.click(calc());
      act(() => vi.advanceTimersByTime(800 * SYSTEMS.slow.steps.length));
    };
    const reset = screen.getByRole("button", { name: "Reset" });
    expect(reset).toBeEnabled();
    expect(reset).toHaveTextContent("Reset"); // a word, not an icon

    // Reset sits left of Calculate.
    const buttons = screen.getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    expect(buttons.indexOf("Reset")).toBeLessThan(buttons.indexOf("Calculate"));

    // Calculate runs the example already on screen, without shuffling.
    run();
    expect(screen.getByText(SYSTEM_EXAMPLES[0].slow.prompt)).toBeInTheDocument();
    // Once both systems are done it greys out, and pressing it changes nothing.
    expect(calc()).toBeDisabled();
    fireEvent.click(calc());
    expect(screen.getByText(SYSTEM_EXAMPLES[0].slow.prompt)).toBeInTheDocument();

    // Reset draws a new problem (never the one just shown), clears the panels and
    // re-enables Calculate. (With Math.random pinned to 0, it picks example 1.)
    fireEvent.click(reset);
    expect(screen.getAllByText("not started")).toHaveLength(2);
    expect(screen.queryByText(SYSTEM_EXAMPLES[0].slow.prompt)).toBeNull();
    expect(screen.getByText(SYSTEM_EXAMPLES[1].slow.prompt)).toBeInTheDocument();
    expect(calc()).toBeEnabled();
    // The closing sentence follows the example on screen.
    expect(document.body.textContent ?? "").toMatch(
      new RegExp(`${SYSTEM_EXAMPLES[1].fast.prompt} is familiar`),
    );
    run();
    expect(screen.getByText(SYSTEM_EXAMPLES[1].slow.prompt)).toBeInTheDocument();
    expect(calc()).toBeDisabled();

    expect(
      screen.getByText("Press Calculate to watch both systems work. Reset gives you a new problem."),
    ).toBeInTheDocument();
    random.mockRestore();
  });

  it("numbers the Kahneman, Stanovich & West and Frederick citations inline and in the references note", () => {
    const { container } = render(<Page1 />);
    // The two-systems framing carries Kahneman's marker, the System 1 / System 2
    // names carry Stanovich & West's, the bat-and-ball question Frederick's...
    const marks = Array.from(container.querySelectorAll("sup"));
    expect(marks).toHaveLength(4);
    expect(marks[0].textContent).toMatch(/1$/);
    expect(marks[1].textContent).toMatch(/2$/);
    expect(marks[2].textContent).toMatch(/3$/);
    expect(marks[3].textContent).toMatch(/4$/);
    // ...each matching a numbered entry in the References note.
    const body = document.body.textContent ?? "";
    expect(body).toMatch(/1\.\s*Daniel Kahneman/);
    expect(body).toMatch(/2\.\s*Stanovich & West/);
    expect(body).toMatch(/3\.\s*Shane Frederick/);
    expect(body).toMatch(/4\.\s*Herbert A\. Simon, “A Behavioral Model of Rational Choice”/);
  });

  it("labels the clocks as a fixed pace, not a measurement", () => {
    render(<Page1 />);
    expect(screen.getByText("The clocks run at a fixed pace: one step every 0.8 s.")).toBeInTheDocument();
  });

  it("follows System 2's scaling with the language-model analogy in section 3", () => {
    render(<Page1 />);
    const section = screen.getByRole("heading", { name: "3. The difference" }).closest("section")!;
    expect(section.textContent).toMatch(
      /harder ones\s*to get them right\. Thinking longer is not free, though: every step costs time and effort,\s*so it is worth taking only while it still buys more accuracy than it costs\. A language\s*model that answers in a single pass is closest to System 1, and letting it write out its\s*steps first is the nearest thing it has to System 2\./,
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

  it("a System 2 pick locks in green; a System 1 pick is marked and cannot be retried", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", { name: /Pick the System 2 tasks/i });
    // No drag and drop and no "Place here": the reader only clicks.
    expect(within(game).queryByRole("button", { name: /place here/i })).toBeNull();
    // No counter: the reader is not told how many System 2 tasks there are.
    expect(within(game).queryByText(/found|\d+ \/ \d+/)).toBeNull();

    const slow = within(game).getByRole("button", { name: /Divide 156 by 12 in your head/i });
    fireEvent.click(slow);
    expect(slow).toBeDisabled();
    expect(slow).toHaveTextContent(/System 2/);

    const fast = within(game).getByRole("button", { name: /Recognize a friend's face/i });
    fireEvent.click(fast);
    expect(fast).toBeDisabled();
    expect(fast).toHaveTextContent(/System 1/);
    // A wrong pick does not end the game.
    expect(within(game).queryByText("That is every System 2 task.")).toBeNull();
  });

  it("shows a colour key for the boxes", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", { name: /Pick the System 2 tasks/i });
    const key = within(game).getByRole("list", { name: "Colour key" });
    expect(key).not.toHaveTextContent(/Not picked yet/);
    expect(key).toHaveTextContent(/System 2/);
    expect(key).toHaveTextContent(/System 1/);
    expect(key.querySelectorAll("li")).toHaveLength(2);
  });

  it("resets every pick with its own Reset button", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", { name: /Pick the System 2 tasks/i });
    const reset = within(game).getByRole("button", { name: "Reset picks" });
    expect(reset).toBeEnabled(); // always available, even before a pick
    const slow = within(game).getByRole("button", { name: /Divide 156 by 12/i });
    const fast = within(game).getByRole("button", { name: /Recognize a friend's face/i });
    fireEvent.click(slow);
    fireEvent.click(fast);
    expect(reset).toBeEnabled();
    fireEvent.click(reset);
    for (const name of [/Divide 156 by 12/i, /Recognize a friend's face/i]) {
      const b = within(game).getByRole("button", { name });
      expect(b).toBeEnabled();
      expect(b).not.toHaveTextContent(/System [12]/);
    }
    expect(reset).toBeEnabled();
  });

  it("logs each pick in the terminal-style output console under the grid", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", { name: /Pick the System 2 tasks/i });
    const out = within(game).getByRole("log", { name: "Output console" });
    expect(out.querySelectorAll("li")).toHaveLength(1);
    expect(out).toHaveTextContent("pick a task to see whether it needs System 2");
    fireEvent.click(within(game).getByRole("button", { name: /Fill in a tax form/i }));
    fireEvent.click(within(game).getByRole("button", { name: /Recognize a friend's face/i }));
    // A running log: every pick stays, newest last.
    const lines = Array.from(out.querySelectorAll("li")).map((li) => li.textContent);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toMatch(/Fill in a tax form → System 2 ✓/);
    expect(lines[2]).toMatch(/Recognize a friend's face → System 1, not this one/);
    fireEvent.click(within(game).getByRole("button", { name: "Reset picks" }));
    expect(out.querySelectorAll("li")).toHaveLength(1);
  });

  it("rewards the reader once every System 2 task is found", () => {
    render(<Page1 />);
    const game = screen.getByRole("region", { name: /Pick the System 2 tasks/i });
    for (const t of [/Divide 156 by 12/i, /Park a car in a tight space/i, /Compare two laptop specs/i, /Fill in a tax form/i]) {
      fireEvent.click(within(game).getByRole("button", { name: t }));
    }
    expect(within(game).getByText("That is every System 2 task.")).toBeInTheDocument();
    expect(within(game).getByText(/You just ran System 2 to tell System 1 from System 2\./)).toBeInTheDocument();
    // The game is over: the System 1 tasks left unpicked turn their colour, are
    // marked System 1, and can no longer be clicked.
    for (const t of [/Hear that a voice is angry/i, /Recognize a friend's face/i, /hot stove/i]) {
      const b = within(game).getByRole("button", { name: t });
      expect(b).toBeDisabled();
      expect(b).toHaveTextContent(/System 1/);
      expect(b.className).toMatch(/bg-ink-muted/);
    }
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
