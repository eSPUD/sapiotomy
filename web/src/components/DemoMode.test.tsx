import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";

let pathname = "/";
const push = vi.fn((href: string) => {
  pathname = href;
});
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push }),
}));

import { DemoMode } from "./DemoMode";
import { DEMO_STOPS } from "@/lib/demo";
import { Page1 } from "./pages/Page1";
import { Page3 } from "./pages/Page3";
import { Page5 } from "./pages/Page5";
import { Page6 } from "./pages/Page6";
import { Page12 } from "./pages/Page12";
import { Page13 } from "./pages/Page13";
import { Page15 } from "./pages/Page15";

const press = (key: string, init: KeyboardEventInit = {}) => fireEvent.keyDown(window, { key, ...init });

beforeEach(() => {
  vi.useFakeTimers();
  pathname = "/";
  push.mockClear();
  window.sessionStorage.clear();
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("presentation mode stops", () => {
  it("are the seven widgets asked for, then the story's closing box, in order", () => {
    expect(DEMO_STOPS.map((s) => [s.page, s.target, s.problem ?? null])).toEqual([
      [1, "p1-s2", null],
      [3, "p3-s1", null],
      [5, "p5-s2", null],
      [6, "p6-s2", null],
      [12, "p12-s2", 2],
      [13, "p13-s2", null],
      [15, "p15-s1", null],
      [15, "p15-close", null],
    ]);
  });

  it.each([
    [Page1, "p1-s2", /Click every task that needs/],
    [Page3, "p3-s1", /Training budget/],
    [Page5, "p5-s2", /Zero-shot vs few-shot|zero-shot/i],
    [Page6, "p6-s2", /./],
    [Page12, "p12-s2", /problem 1 of \d/],
    [Page13, "p13-s2", /./],
    [Page15, "p15-s1", /./],
    [Page15, "p15-close", /The one sentence to leave with/],
  ] as const)("tags each stop's widget in its page (%#)", (Page, target, text) => {
    vi.useRealTimers();
    const { container } = render(<Page />);
    const el = container.querySelector(`[data-demo="${target}"]`);
    expect(el).not.toBeNull();
    expect(el!.textContent).toMatch(text);
  });
});

describe("DemoMode", () => {
  it("P enters at page 1's widget, spotlights it, and names the stop", () => {
    const { rerender } = render(<DemoMode />);
    press("p");
    expect(push).toHaveBeenCalledWith("/p/1");
    // The page arrives with its widget; the next poll finds and spotlights it.
    const w = document.createElement("section");
    w.dataset.demo = "p1-s2";
    document.body.appendChild(w);
    rerender(<DemoMode />);
    act(() => vi.advanceTimersByTime(100));
    expect(w).toHaveAttribute("data-demo-active", "true");
    expect(w.scrollIntoView).toHaveBeenCalled();
    expect(screen.getByRole("status", { name: "Presentation mode" })).toHaveTextContent(
      `Demo 1 / ${DEMO_STOPS.length}Page 1 · Which tasks need System 2?P next · Q quit`,
    );
  });

  it("each P moves on a stop, through all eight, then returns to the landing page and leaves", () => {
    const { rerender } = render(<DemoMode />);
    const visited: string[] = [];
    for (let i = 0; i < DEMO_STOPS.length; i++) {
      press("p");
      rerender(<DemoMode />);
      visited.push(pathname);
    }
    expect(visited).toEqual(["/p/1", "/p/3", "/p/5", "/p/6", "/p/12", "/p/13", "/p/15", "/p/15"]);
    // The last stop says so.
    expect(screen.getByRole("status", { name: "Presentation mode" })).toHaveTextContent("P finish · Q quit");
    press("p");
    rerender(<DemoMode />);
    expect(pathname).toBe("/");
    expect(screen.queryByRole("status", { name: "Presentation mode" })).toBeNull();
    expect(window.sessionStorage.getItem("demo-mode-step")).toBeNull();
    // A further P starts the demo again from the first stop.
    press("p");
    rerender(<DemoMode />);
    expect(pathname).toBe("/p/1");
  });

  it("lets the arrow keys leave a stop's page without being pulled back", () => {
    pathname = "/p/1";
    window.history.replaceState(null, "", "/p/1");
    const { rerender } = render(<DemoMode />);
    press("p");
    rerender(<DemoMode />);
    push.mockClear();
    // The presenter moves on to page 2 by other means (KeyboardNav's →).
    pathname = "/p/2";
    rerender(<DemoMode />);
    act(() => vi.advanceTimersByTime(200));
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("status", { name: "Presentation mode" })).toHaveTextContent(`Demo 1 / ${DEMO_STOPS.length}`);
    window.history.replaceState(null, "", "/");
  });

  it("asks page 12's widget for problem 2", () => {
    vi.useRealTimers();
    pathname = "/p/12";
    window.sessionStorage.setItem("demo-mode-step", String(DEMO_STOPS.findIndex((s) => s.page === 12)));
    render(
      <>
        <Page12 />
        <DemoMode />
      </>,
    );
    return vi.waitFor(() => {
      const fig = document.querySelector('[data-demo="p12-s2"]')!;
      expect(fig).toHaveAttribute("data-demo-active", "true");
      expect(fig.textContent).toMatch(/problem 2 of \d/);
    });
  });

  it("Q leaves: the badge goes and the spotlight with it", () => {
    pathname = "/p/1";
    const w = document.createElement("section");
    w.dataset.demo = "p1-s2";
    document.body.appendChild(w);
    const { rerender } = render(<DemoMode />);
    press("p");
    rerender(<DemoMode />);
    act(() => vi.advanceTimersByTime(100));
    expect(w).toHaveAttribute("data-demo-active");
    press("q");
    rerender(<DemoMode />);
    expect(screen.queryByRole("status", { name: "Presentation mode" })).toBeNull();
    expect(w).not.toHaveAttribute("data-demo-active");
    expect(window.sessionStorage.getItem("demo-mode-step")).toBeNull();
  });

  it("leaves modified keys and typing in a text field alone", () => {
    render(<DemoMode />);
    press("p", { metaKey: true });
    press("p", { ctrlKey: true });
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    press("p");
    expect(push).not.toHaveBeenCalled();
    expect(screen.queryByRole("status", { name: "Presentation mode" })).toBeNull();
  });

  it("stays in the demo across a reload", () => {
    const at = DEMO_STOPS.findIndex((s) => s.page === 13);
    window.sessionStorage.setItem("demo-mode-step", String(at));
    pathname = "/p/13";
    render(<DemoMode />);
    expect(screen.getByRole("status", { name: "Presentation mode" })).toHaveTextContent(
      `Demo ${at + 1} / ${DEMO_STOPS.length}`,
    );
  });
});
