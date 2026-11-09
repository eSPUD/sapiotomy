import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Page17 } from "./Page17";
import { GLOSSARY, PAGES, STORY_PAGES, getPage } from "@/lib/pages";

describe("Page 17: the glossary", () => {
  it("is the last page, flagged as the appendix, and the story is still 1 to 16", () => {
    const last = PAGES[PAGES.length - 1];
    expect(last).toMatchObject({ n: 17, title: "Glossary", appendix: true });
    expect(PAGES.filter((p) => p.appendix)).toEqual([last]);
    expect(STORY_PAGES.map((p) => p.n)).toEqual(Array.from({ length: 16 }, (_, i) => i + 1));
  });

  // The author: never show the glossary as part of Act 3, on the landing page or
  // anywhere else. It has no act at all, and story-page lookups do not return it.
  it("belongs to no act", () => {
    expect(GLOSSARY.n).toBe(17);
    expect(GLOSSARY.act).toBeUndefined();
    expect("act" in GLOSSARY).toBe(false);
    expect(getPage(17)).toBeUndefined();
    expect(STORY_PAGES.filter((p) => p.act === 3).map((p) => p.n)).toEqual([12, 13, 14, 15, 16]);
  });

  it("reads as an appendix, not an act", () => {
    render(<Page17 />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("17. Glossary");
    expect(screen.getByText("Appendix")).toBeInTheDocument();
    expect(screen.queryByText(/Act 3/)).toBeNull();
  });

  it("defines token and greedy decoding, moved from page 5's Terms note", () => {
    render(<Page17 />);
    const text = document.body.textContent ?? "";
    expect(text).toMatch(/Token\s*A word-piece, the unit a model writes one at a time/);
    expect(text).toContain("Every length in this explainer is counted in tokens.");
    expect(text).toMatch(/Greedy decoding\s*At every step the model takes its single most likely next token/);
    expect(text).toContain("the same prompt always produces the same chain");
  });

  it("anchors each term so pages can link straight to it", () => {
    const { container } = render(<Page17 />);
    expect(container.querySelector("#token")).not.toBeNull();
    expect(container.querySelector("#greedy")).not.toBeNull();
  });

  it("ends the deck: back to page 16, then The End", () => {
    render(<Page17 />);
    expect(screen.getByRole("link", { name: /^← 16\. Wrap-Up/ })).toHaveAttribute("href", "/p/16");
    expect(screen.getByText("The End")).toBeInTheDocument();
  });
});
