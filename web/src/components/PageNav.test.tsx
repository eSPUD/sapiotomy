import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

let pathname = "/p/5";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

import { PageNav } from "./PageNav";
import { TopPageNav } from "./TopPageNav";

describe("PageNav", () => {
  it("is two small bordered buttons naming the pages either side", () => {
    render(<PageNav n={5} />);
    const nav = screen.getByRole("navigation", { name: "Page navigation" });
    const [prev, next] = within(nav).getAllByRole("link");
    expect(prev).toHaveAccessibleName("← 4. From Reasoning to Inference-Time Scaling");
    expect(prev).toHaveAttribute("href", "/p/4");
    expect(next).toHaveAccessibleName("6. Thinking Longer →");
    expect(next).toHaveAttribute("href", "/p/6");
    for (const b of [prev, next]) expect(b).toHaveClass("border", "rounded-full", "text-sm", "py-1.5");
    // Each takes at most half the row, so a long title wraps inside its own button.
    for (const b of [prev, next]) expect(b).toHaveClass("max-w-[48%]");
  });

  it("goes home from page 1 and ends on The End", () => {
    const { unmount } = render(<PageNav n={1} />);
    expect(screen.getByRole("link", { name: "← Home" })).toHaveAttribute("href", "/");
    unmount();
    render(<PageNav n={17} />);
    expect(screen.getByText("The End")).toBeInTheDocument();
  });
});

describe("TopPageNav", () => {
  it("repeats the buttons at the top, below xl only, under its own landmark name", () => {
    pathname = "/p/5";
    const { container } = render(<TopPageNav />);
    expect(container.firstElementChild).toHaveClass("xl:hidden");
    const nav = screen.getByRole("navigation", { name: "Previous and next page" });
    expect(within(nav).getByRole("link", { name: "6. Thinking Longer →" })).toHaveAttribute("href", "/p/6");
  });

  it("renders nothing off a story page", () => {
    pathname = "/";
    const { container } = render(<TopPageNav />);
    expect(container).toBeEmptyDOMElement();
  });
});
