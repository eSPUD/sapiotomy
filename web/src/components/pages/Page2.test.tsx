import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

// Reduced motion is ON by default so the page takes its instant paths: answers
// appear whole, the crack verdict lands without its beat, and the trace becomes
// a step-through. The animated describe block below flips it OFF to cover the
// typing interval, the prediction gate, the crack beat, and trace autoplay.
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

import { Page2 } from "./Page2";

const BANNED = /training|inference|trained/i;
const expectClean = () => {
  expect(document.body.textContent ?? "").not.toMatch(BANNED);
};

const ask = () => fireEvent.click(screen.getByRole("button", { name: /ask it/i }));
const askThrough3 = () => {
  ask();
  ask();
  ask();
};
const pickCracks = () => fireEvent.click(screen.getByRole("button", { name: "It cracks" }));

describe("Page 2 (the machine's two speeds)", () => {
  beforeEach(() => {
    reducedMotion = true;
  });

  it("starts with the ask button and zero answer rows", () => {
    render(<Page2 />);
    expect(screen.getByRole("button", { name: /ask it/i })).toBeInTheDocument();
    expect(screen.queryByText("2 + 2")).toBeNull();
    expect(screen.queryByText(/instant, right\./)).toBeNull();
    expect(screen.queryByText("28,793,796")).toBeNull();
    expectClean();
  });

  it("three asks produce three right-verdict rows, then the prediction gates the last rung", () => {
    render(<Page2 />);
    askThrough3();
    expect(screen.getAllByText(/✓ instant, right\./)).toHaveLength(3);
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("408")).toBeInTheDocument();
    expect(screen.getByText("223,300")).toBeInTheDocument();
    // The prediction card appears and the ask button is gone.
    expect(screen.getByText("Before the last one, a prediction")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ask it/i })).toBeNull();
    expect(screen.getByRole("button", { name: "It holds" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "It cracks" })).toHaveAttribute("aria-pressed", "false");
    expectClean();
  });

  it("picking It cracks plays the last rung with the wrong verdict and reveals the crack", () => {
    render(<Page2 />);
    askThrough3();
    pickCracks();
    expect(screen.getByRole("button", { name: "It cracks" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("A suspicious mind. Watch.")).toBeInTheDocument();
    // The blurted value and the true product both render.
    expect(screen.getAllByText("28,793,796").length).toBeGreaterThan(0);
    expect(screen.getByText(/✗ wrong\./)).toBeInTheDocument();
    expect(screen.getAllByText("28,803,796").length).toBeGreaterThan(0);
    expect(screen.getByText(/Off by exactly 10,000/)).toBeInTheDocument();
    // The crack callout and the trace panel reveal.
    expect(screen.getByText(/Nothing on the surface changed\./)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show next step/i })).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: /scrub through the trace/i })).toBeInTheDocument();
    expectClean();
  });

  it("jump to end reveals the final answer, honesty note, and teaser", () => {
    render(<Page2 />);
    askThrough3();
    pickCracks();
    fireEvent.click(screen.getByRole("button", { name: /jump to end/i }));
    // Matches both the trace's last step and the final-answer line.
    expect(screen.getAllByText(/4502 × 6398 = 28,803,796/).length).toBeGreaterThan(1);
    expect(screen.getByText("Answer:", { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/The blurt said 28,793,796\. Six steps of checking caught it\./)).toBeInTheDocument();
    expect(screen.getByText("Honesty note")).toBeInTheDocument();
    expect(screen.getByText(/print\(4502 \* 6398\)/)).toBeInTheDocument();
    expect(screen.getByText(/Next page: match night\./)).toBeInTheDocument();
    expect(screen.getByText(/Notice what the trace did\./)).toBeInTheDocument();
    expectClean();
  });

  it("steps the trace one segment at a time under reduced motion", () => {
    render(<Page2 />);
    askThrough3();
    pickCracks();
    const step = screen.getByRole("button", { name: /show next step/i });
    fireEvent.click(step);
    expect(screen.getByText(/First instinct says 28,793,796\./)).toBeInTheDocument();
    expect(screen.queryByText(/Six steps of checking caught it\./)).toBeNull();
    expectClean();
  });

  it("picking It holds locks the prediction and shows the fair-bet line", () => {
    render(<Page2 />);
    askThrough3();
    fireEvent.click(screen.getByRole("button", { name: "It holds" }));
    expect(screen.getByRole("button", { name: "It holds" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("A fair bet; the streak has been perfect. Watch.")).toBeInTheDocument();
    // Reduced motion lands the last rung immediately; the streak still cracks.
    expect(screen.getByText(/✗ wrong\./)).toBeInTheDocument();
    // The prediction is locked: the other choice is inert now.
    fireEvent.click(screen.getByRole("button", { name: "It cracks" }));
    expect(screen.getByRole("button", { name: "It holds" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "It cracks" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expectClean();
  });

  it("read-as-document reveals the whole trace and the final answer", () => {
    render(<Page2 />);
    askThrough3();
    pickCracks();
    const doc = screen.getByRole("button", { name: /read as document/i });
    expect(doc).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(doc);
    expect(doc).toHaveAttribute("aria-pressed", "true");
    // The full trace text is out, through the final segment and the answer line.
    expect(screen.getByText(/Both routes agree\./)).toBeInTheDocument();
    expect(screen.getByText(/Six steps of checking caught it\./)).toBeInTheDocument();
    expectClean();
  });

  it("never renders the banned words at any stage of the journey", () => {
    render(<Page2 />);
    expectClean();
    ask();
    expectClean();
    ask();
    expectClean();
    ask();
    expectClean();
    pickCracks();
    expectClean();
    fireEvent.click(screen.getByRole("button", { name: /jump to end/i }));
    expectClean();
  });
});

// The animated paths: reduced motion OFF with fake timers, covering the 45ms
// typing interval, the 500ms prediction gate, the 700ms crack beat, and the
// 60ms trace autoplay with pause/resume.
describe("Page 2 animated paths (no reduced motion)", () => {
  beforeEach(() => {
    reducedMotion = false;
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    reducedMotion = true;
  });

  /** Click "Ask it" and advance through the typing of an answer of `len` chars. */
  const askAnimated = (len: number) => {
    fireEvent.click(screen.getByRole("button", { name: /ask it/i }));
    act(() => {
      vi.advanceTimersByTime(45 * len + 10);
    });
  };

  it("types each blurt in character by character before its verdict lands", () => {
    render(<Page2 />);
    fireEvent.click(screen.getByRole("button", { name: /ask it/i }));
    // Mid-typing the ask button is disabled and no verdict has landed.
    expect(screen.getByRole("button", { name: /ask it/i })).toBeDisabled();
    expect(screen.queryByText(/✓ instant, right\./)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(55);
    });
    expect(screen.getAllByText(/✓ instant, right\./)).toHaveLength(1);
    expect(screen.getByRole("button", { name: /ask it/i })).toBeEnabled();
    askAnimated(3); // "408"
    askAnimated(7); // "223,300"
    expect(screen.getAllByText(/✓ instant, right\./)).toHaveLength(3);
    expect(screen.getByText("Before the last one, a prediction")).toBeInTheDocument();
  });

  it("plays the last rung through the 500ms gate, the typing, and the 700ms beat", () => {
    render(<Page2 />);
    askAnimated(1);
    askAnimated(3);
    askAnimated(7);
    fireEvent.click(screen.getByRole("button", { name: "It cracks" }));
    // Nothing lands until the 500ms gate opens.
    expect(screen.queryByText("28,793,796")).toBeNull();
    act(() => {
      vi.advanceTimersByTime(500);
    });
    // The blurt types in (10 chars), but the verdict waits out the 700ms beat.
    act(() => {
      vi.advanceTimersByTime(460);
    });
    expect(screen.getAllByText("28,793,796").length).toBeGreaterThan(0);
    expect(screen.queryByText(/✗ wrong\./)).toBeNull();
    expect(screen.queryByText(/Nothing on the surface changed\./)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(screen.getByText(/✗ wrong\./)).toBeInTheDocument();
    expect(screen.getByText(/Nothing on the surface changed\./)).toBeInTheDocument();
    expectClean();
  });

  it("autoplays the trace with announced play/pause and finishes exactly once", () => {
    render(<Page2 />);
    askAnimated(1);
    askAnimated(3);
    askAnimated(7);
    fireEvent.click(screen.getByRole("button", { name: "It cracks" }));
    // Gate, typing, and beat need separate advances so each stage's effect flushes.
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      vi.advanceTimersByTime(460);
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });
    fireEvent.click(screen.getByRole("button", { name: /▶ play/i }));
    expect(screen.getByText("Trace playing.")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByRole("button", { name: /⏸ pause/i }));
    expect(screen.getByText("Trace paused.")).toBeInTheDocument();
    expect(screen.queryByText(/Six steps of checking caught it\./)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /▶ play/i }));
    act(() => {
      vi.advanceTimersByTime(20000);
    });
    expect(screen.getByText(/Trace finished\./)).toBeInTheDocument();
    expect(screen.getByText(/Six steps of checking caught it\./)).toBeInTheDocument();
    expect(screen.getByText(/Notice what the trace did\./)).toBeInTheDocument();
    // The player is idle again, showing Play rather than Pause.
    expect(screen.getByRole("button", { name: /▶ play/i })).toBeInTheDocument();
    expectClean();
  });
});
