import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("landing: authors", () => {
  // Name, then role and degree, then department and university, one per line
  // (author, 2026-11-09).
  it("sets each author as name, role, then department and university", () => {
    render(<Home />);
    const list = screen.getByRole("heading", { level: 2, name: "Authors" }).nextElementSibling!;
    const authors = [...list.querySelectorAll("li")].map((li) =>
      [...li.children].map((c) => c.textContent?.replace(/\s+/g, " ").trim()),
    );
    expect(authors).toEqual([
      [
        "Shashank Bangalore Lakshman*",
        "Graduate Student, M.S. in Artificial Intelligence",
        "Department of Computer Science, The University of Texas at Austin",
      ],
      ["Scott Lawrence Eiers", "Undergraduate Student, B.S. in Computer Science", "Western Governors University"],
    ]);
    expect(screen.getByText(/Corresponding author\./)).toBeInTheDocument();
  });
});

describe("landing: lede", () => {
  it("spans the page's full width, with no width cap", () => {
    render(<Home />);
    const lede = screen.getByText(/Same model, same weights, better answers/).closest("p")!;
    expect(lede.className).not.toMatch(/max-w-/);
  });
});
