import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

// Deterministic reduced-motion: the page (and Reveal / framer-motion) takes
// its instant path, so reveals appear synchronously with no animation.
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

import { Page3 } from "./Page3";
import { MATCH_NIGHT } from "@/lib/authored";

describe("Page 3 (Match Night)", () => {
  it("initially shows the forecast card only", () => {
    render(<Page3 />);
    expect(screen.getByText("Who wins tonight?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The favorite" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "The underdog" })).toBeInTheDocument();
    // Later beats are hidden until the first pick.
    expect(screen.queryByText("Thinking pays.")).not.toBeInTheDocument();
    expect(screen.queryByText(/Breaking, an hour before kickoff/i)).not.toBeInTheDocument();
    expect(screen.queryByText("One more question")).not.toBeInTheDocument();
    expect(screen.queryByText("Memorized")).not.toBeInTheDocument();
    // Navigation is always present.
    expect(screen.getByRole("navigation", { name: /page navigation/i })).toBeInTheDocument();
  });

  it("picking The favorite reveals the follow-up and the breaking-news card", () => {
    render(<Page3 />);
    fireEvent.click(screen.getByRole("button", { name: "The favorite" }));
    expect(screen.getByRole("button", { name: "The favorite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Thinking pays.")).toBeInTheDocument();
    expect(screen.getByText(/Breaking, an hour before kickoff/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stick with my pick" })).toBeInTheDocument();
  });

  it("locks the forecast pick after the first choice", () => {
    render(<Page3 />);
    fireEvent.click(screen.getByRole("button", { name: "The favorite" }));
    fireEvent.click(screen.getByRole("button", { name: "The underdog" }));
    expect(screen.getByRole("button", { name: "The favorite" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "The underdog" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("picking Switch reveals the past-final card and strikes the form-guide line", () => {
    const { container } = render(<Page3 />);
    fireEvent.click(screen.getByRole("button", { name: "The underdog" }));
    fireEvent.click(screen.getByRole("button", { name: "Switch" }));
    expect(screen.getByRole("button", { name: "Switch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Thinking pays again.")).toBeInTheDocument();
    expect(screen.getByText("One more question")).toBeInTheDocument();
    // The dead line of the form guide: struck original plus replacement.
    expect(screen.getByText(MATCH_NIGHT.injuredLineReplacement)).toBeInTheDocument();
    const struck = container.querySelector("s");
    expect(struck).not.toBeNull();
    expect(struck).toHaveTextContent(
      MATCH_NIGHT.formGuide.favorite[MATCH_NIGHT.injuredLineIndex],
    );
  });

  it("picking I've got nothing reveals only that follow-up, the agent line, the shelves, and the teaser", () => {
    const { container } = render(<Page3 />);
    fireEvent.click(screen.getByRole("button", { name: "The favorite" }));
    fireEvent.click(screen.getByRole("button", { name: "Stick with my pick" }));
    fireEvent.click(screen.getByRole("button", { name: "I've got nothing" }));

    expect(screen.getByText(/An hour would not help/)).toBeInTheDocument();
    expect(screen.queryByText(/Zero steps, zero effort/)).not.toBeInTheDocument();
    expect(screen.getByText(/An agent is in exactly the same spot/)).toBeInTheDocument();

    // The two shelves and the teaser.
    expect(screen.getByText("Memorized")).toBeInTheDocument();
    expect(screen.getByText("Understood")).toBeInTheDocument();
    expect(container.textContent).toContain("Next page.");

    // The past year renders from the authored data; the winner is never stated.
    expect(container.textContent).toContain(String(MATCH_NIGHT.pastYear));
    expect(container.textContent).not.toContain("Spain");
    expect(container.textContent).not.toMatch(/training|inference|trained/i);
  });
});
